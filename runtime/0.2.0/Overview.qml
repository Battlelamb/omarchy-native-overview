// SPDX-License-Identifier: GPL-3.0-only
import QtQuick
import Quickshell
import Quickshell.Hyprland
import Quickshell.Wayland
import qs.Ui
import qs.Commons
import qs.Commons as Commons
import "WindowModel.js" as WindowModel

Item {
    id: root
    property var shell: null
    property var manifest: null
    property bool opened: false
    property bool opening: false
    property string raw: "[]"
    property string query: ""
    property bool workspaceOnly: false
    property int selected: 0
    property string requestedAddress: ""
    property int requestedWorkspace: 0
    property bool refreshPending: false
    property bool actionPending: false
    property string actionError: ""
    readonly property bool actionBusy: requestedAddress !== "" || verify.running || focusAction.running || actionPending
    readonly property var clients: WindowModel.validClients(raw)
    readonly property var currentWorkspace: Hyprland.focusedWorkspace ? Hyprland.focusedWorkspace.id : NaN
    readonly property var matches: WindowModel.filterRows(clients, query, workspaceOnly ? currentWorkspace : undefined)
    onMatchesChanged: selected = Math.max(0, Math.min(selected, matches.length - 1))

    function open(payloadJson) {
        if (opened || opening) return;
        query = ""; selected = 0; workspaceOnly = false; raw = "[]"; opening = true;
        lockProbe.start();
    }
    function close() {
        opening = false;
        opened = false; raw = "[]"; query = ""; workspaceOnly = false; requestedAddress = ""; requestedWorkspace = 0;
        actionPending = false; actionError = "";
        refreshPending = false; updateTimer.stop();
        lockProbe.cancel(); refresh.cancel(); verify.cancel(); focusAction.cancel();
    }
    function dismiss() {
        close();
        if (shell && manifest) shell.hide(manifest.id);
    }
    function toggle() { if (opened) dismiss(); else open("{}"); }
    function toggleScope() {
        workspaceOnly = !workspaceOnly;
        selected = 0;
    }
    function clearSearch() {
        query = ""; selected = 0;
        keyboard.forceActiveFocus();
    }
    function activate(index, bringHere) {
        if (!opened || opening || lockProbe.running || index < 0 || index >= matches.length || actionBusy) return;
        if (bringHere && (!Hyprland.focusedWorkspace || Hyprland.focusedWorkspace.id < 1)) return;
        requestedAddress = matches[index].address;
        requestedWorkspace = bringHere ? Hyprland.focusedWorkspace.id : 0;
        actionError = "";
        verify.start();
    }
    function queueRefresh() {
        if (!opened) return;
        refreshPending = true;
        if (!updateTimer.running) updateTimer.start();
    }
    function runRefresh() {
        if (!opened || !refreshPending || updateTimer.running || refresh.running) return;
        refreshPending = false;
        refresh.start();
    }
    function finishAction(errorKey) {
        if (!actionPending) return;
        actionPending = false;
        if (!opened) return;
        if (errorKey) actionError = errorKey;
        else dismiss();
    }

    // shortcut: compositor lock state is sampled while open; replace polling if a lock event API appears.
    Timer {
        interval: 250; repeat: true; running: root.opened
        onTriggered: if (!lockProbe.running) lockProbe.start()
    }
    BoundedProcess {
        id: lockProbe
        command: ["/usr/bin/omarchy-hyprland-session-locked"]
        byteLimit: 1024
        onCompleted: (code, status, text, error) => {
            if (!root.opening && !root.opened) return;
            if (error || code !== 1 || status !== 0) { root.dismiss(); return; }
            if (root.opening) {
                root.opening = false; root.opened = true;
                refresh.start();
                Qt.callLater(function() { if (root.opened) keyboard.forceActiveFocus(); });
            }
        }
    }
    Commons.Translations { id: strings; directory: Qt.resolvedUrl("i18n") }
    Timer { id: updateTimer; interval: 80; onTriggered: root.runRefresh() }
    Connections {
        target: Hyprland
        function onRawEvent(event) { root.queueRefresh(); }
    }
    BoundedProcess {
        id: refresh
        command: ["/usr/bin/hyprctl", "clients", "-j"]
        onCompleted: (code, status, text, error) => {
            if (!root.opened) return;
            root.raw = !error && code === 0 && status === 0 ? text : "[]";
            root.runRefresh();
        }
    }
    BoundedProcess {
        id: verify
        command: ["/usr/bin/hyprctl", "clients", "-j"]
        onCompleted: (code, status, text, error) => {
            if (!root.opened || !root.requestedAddress) return;
            if (error || code !== 0 || status !== 0 || root.opening || lockProbe.running) {
                root.requestedAddress = ""; root.requestedWorkspace = 0;
                root.actionError = error === "startFailed" ? "actionStartFailed" : "actionFailed"; return;
            }
            var request = root.requestedWorkspace > 0
                ? WindowModel.moveRequest(root.requestedAddress, root.requestedWorkspace, text)
                : WindowModel.focusRequest(root.requestedAddress, text);
            root.requestedAddress = ""; root.requestedWorkspace = 0;
            if (!request) { refresh.start(); return; }
            root.actionPending = true;
            focusAction.command = ["/usr/bin/hyprctl", "dispatch", request];
            focusAction.start();
        }
    }
    BoundedProcess {
        id: focusAction
        byteLimit: 4096
        // shortcut: accept only the explicit ok acknowledgement; revisit if the dispatcher protocol changes.
        onCompleted: (code, status, text, error) => {
            root.finishAction(error === "startFailed" ? "actionStartFailed"
                : !error && code === 0 && status === 0 && text.trim() === "ok" ? "" : "actionFailed");
        }
    }

    component Label: Text {
        textFormat: Text.PlainText
        color: Commons.Color.menu.text
        font.family: Style.font.menuFamily
        font.pixelSize: Style.font.body
        horizontalAlignment: Commons.I18n.rightToLeft ? Text.AlignRight : Text.AlignLeft
        elide: Text.ElideRight
    }

    OverlayWindow {
        id: panel
        shown: root.opened
        onTargetScreenChanged: if (root.opened && !targetScreen) root.dismiss()
        WlrLayershell.namespace: "native-overview"
        Rectangle { anchors.fill: parent; color: Commons.Color.menu.scrim }
        MouseArea { anchors.fill: parent; onClicked: root.dismiss() }
        Rectangle {
            id: card
            objectName: "overview-card"
            readonly property bool compact: height < Style.space(440)
            anchors.centerIn: parent
            width: Math.min(Style.space(1000), panel.width - Style.space(32))
            height: Math.min(Style.space(580), panel.height - Style.space(32))
            color: Commons.Color.menu.background
            border.color: Commons.Color.menu.border
            border.width: 1
            radius: Style.cornerRadius
            LayoutMirroring.enabled: Commons.I18n.rightToLeft
            LayoutMirroring.childrenInherit: true
            MouseArea { anchors.fill: parent; onClicked: {} }
            Item {
                id: keyboard
                anchors.fill: parent
                focus: true
                Keys.onPressed: function(event) {
                    if (event.key === Qt.Key_Escape) root.dismiss();
                    else if (event.key === Qt.Key_Space && event.modifiers === Qt.ControlModifier) root.toggleScope();
                    else if (event.key === Qt.Key_M && (event.modifiers & Qt.ControlModifier)) root.activate(root.selected, true);
                    else if (event.key === Qt.Key_Return || event.key === Qt.Key_Enter) root.activate(root.selected);
                    else if (event.key === Qt.Key_Down && root.matches.length) root.selected = (root.selected + 1) % root.matches.length;
                    else if (event.key === Qt.Key_Up && root.matches.length) root.selected = (root.selected + root.matches.length - 1) % root.matches.length;
                    else if (Util.editsFilter(event, root.query)) { root.query = Util.editedFilter(event, root.query).slice(0, 256); root.selected = 0; }
                    else if (event.text && event.text.length && event.text.charCodeAt(0) >= 32 && !(event.modifiers & (Qt.ControlModifier | Qt.AltModifier | Qt.MetaModifier))) { root.query = (root.query + event.text).slice(0, 256); root.selected = 0; }
                    else return;
                    results.positionViewAtIndex(root.selected, ListView.Contain);
                    event.accepted = true;
                }
            }
            Item {
                id: content
                anchors.fill: parent
                anchors.margins: card.compact ? Style.space(12) : Style.space(20)
                readonly property int gap: card.compact ? Style.space(8) : Style.space(12)
                Item {
                    id: heading
                    width: parent.width
                    height: Math.max(titleLabel.implicitHeight, resultCount.implicitHeight)
                    Label {
                        id: titleLabel
                        anchors.left: parent.left
                        anchors.right: resultCount.left
                        anchors.rightMargin: content.gap
                        text: strings.t("title")
                        font.pixelSize: Style.font.heading
                        font.bold: true
                    }
                    Label {
                        id: resultCount
                        objectName: "overview-count"
                        anchors.right: parent.right
                        anchors.verticalCenter: parent.verticalCenter
                        text: strings.tn("results", root.matches.length).arg(Commons.I18n.formatNumber(root.matches.length))
                        font.pixelSize: Style.font.bodySmall
                        opacity: 0.7
                    }
                }
                Rectangle {
                    id: searchField
                    anchors.top: heading.bottom
                    anchors.topMargin: content.gap
                    width: parent.width
                    height: Math.max(Style.space(42), searchLabel.implicitHeight + Style.space(20))
                    radius: Style.cornerRadius
                    color: Commons.Color.menu.background
                    border.color: keyboard.activeFocus ? Commons.Color.menu.text : Commons.Color.menu.border
                    border.width: 1
                    Accessible.role: Accessible.EditableText
                    Accessible.name: strings.t("search")
                    Accessible.description: root.query
                    MouseArea { anchors.fill: parent; cursorShape: Qt.IBeamCursor; onClicked: keyboard.forceActiveFocus() }
                    Label {
                        id: searchLabel
                        anchors.left: parent.left
                        anchors.leftMargin: Style.space(12)
                        anchors.right: clearButton.visible ? clearButton.left : parent.right
                        anchors.rightMargin: Style.space(12)
                        anchors.verticalCenter: parent.verticalCenter
                        text: root.query || strings.t("search")
                        opacity: root.query ? 1 : 0.55
                        font.pixelSize: Style.font.title
                    }
                    Button {
                        id: clearButton
                        objectName: "overview-clear"
                        anchors.right: parent.right
                        anchors.rightMargin: Style.space(4)
                        anchors.verticalCenter: parent.verticalCenter
                        visible: root.query.length > 0
                        text: "×"
                        foreground: Commons.Color.menu.text
                        fontFamily: Style.font.menuFamily
                        fontSize: Style.font.title
                        Accessible.role: Accessible.Button
                        Accessible.name: strings.t("clearSearch")
                        Accessible.onPressAction: root.clearSearch()
                        onClicked: { root.clearSearch(); }
                    }
                }
                Item {
                    id: scopeRow
                    anchors.top: searchField.bottom
                    anchors.topMargin: content.gap
                    width: parent.width
                    height: scopeButton.implicitHeight
                    Button {
                        id: scopeButton
                        objectName: "overview-scope"
                        anchors.left: parent.left
                        width: Math.min(implicitWidth, parent.width)
                        text: strings.t("currentWorkspace")
                        selected: root.workspaceOnly
                        bordered: true
                        foreground: Commons.Color.menu.text
                        accent: Commons.Color.menu.selectedText
                        fontFamily: Style.font.menuFamily
                        fontSize: Style.font.bodySmall
                        Accessible.role: Accessible.Button
                        Accessible.name: strings.t("currentWorkspace")
                        Accessible.description: strings.t("scopeHint")
                        Accessible.checkable: true
                        Accessible.checked: root.workspaceOnly
                        Accessible.onPressAction: { root.toggleScope(); keyboard.forceActiveFocus(); }
                        onClicked: { root.toggleScope(); keyboard.forceActiveFocus(); }
                    }
                    Label {
                        anchors.left: scopeButton.right
                        anchors.leftMargin: content.gap
                        anchors.right: parent.right
                        anchors.verticalCenter: parent.verticalCenter
                        text: strings.t("scopeHint")
                        font.pixelSize: Style.font.bodySmall
                        opacity: 0.6
                    }
                }
                Item {
                    id: body
                    readonly property bool wide: width >= Style.space(760)
                    anchors.top: scopeRow.bottom
                    anchors.topMargin: content.gap
                    width: parent.width
                    height: Math.max(0, footer.y - y - content.gap)
                    Item {
                        id: resultsPane
                        anchors.left: parent.left
                        anchors.top: body.wide ? parent.top : previewPane.bottom
                        anchors.topMargin: body.wide ? 0 : content.gap
                        anchors.bottom: parent.bottom
                        width: body.wide ? Math.floor((parent.width - content.gap) * 0.44) : parent.width
                        ListView {
                            id: results
                            objectName: "overview-results"
                            anchors.fill: parent
                            clip: true
                            spacing: Style.space(5)
                            model: root.matches
                            boundsBehavior: Flickable.StopAtBounds
                            delegate: Rectangle {
                                id: row
                                required property var modelData
                                required property int index
                                readonly property bool chosen: index === root.selected
                                readonly property color foreground: chosen ? Commons.Color.menu.selectedText : Commons.Color.menu.text
                                width: results.width
                                height: Math.max(Style.space(64), rowText.implicitHeight + Style.space(20))
                                radius: Style.cornerRadius
                                color: chosen ? Commons.Color.menu.selectedBackground : "transparent"
                                border.width: rowMouse.containsMouse ? 1 : 0
                                border.color: Commons.Color.menu.border
                                Rectangle {
                                    id: workspacePill
                                    anchors.right: parent.right
                                    anchors.rightMargin: Style.space(10)
                                    anchors.verticalCenter: parent.verticalCenter
                                    width: Math.min(parent.width * 0.35, workspaceLabel.implicitWidth + Style.space(12))
                                    height: workspaceLabel.implicitHeight + Style.space(8)
                                    color: "transparent"
                                    border.color: row.foreground
                                    border.width: 1
                                    radius: Style.cornerRadius
                                    opacity: 0.7
                                    Label {
                                        id: workspaceLabel
                                        anchors.centerIn: parent
                                        width: Math.max(0, parent.width - Style.space(12))
                                        text: strings.t("workspaceBadge").arg(Commons.I18n.formatNumber(row.modelData.workspace))
                                        color: row.foreground
                                        font.pixelSize: Style.font.caption
                                    }
                                }
                                Column {
                                    id: rowText
                                    anchors.left: parent.left
                                    anchors.leftMargin: Style.space(10)
                                    anchors.right: workspacePill.left
                                    anchors.rightMargin: Style.space(10)
                                    anchors.verticalCenter: parent.verticalCenter
                                    spacing: Style.space(4)
                                    Label {
                                        width: parent.width
                                        text: row.modelData.title || row.modelData.app
                                        color: row.foreground
                                        font.pixelSize: Style.font.title
                                    }
                                    Label {
                                        width: parent.width
                                        text: row.modelData.app
                                        color: row.foreground
                                        font.pixelSize: Style.font.bodySmall
                                        opacity: 0.7
                                    }
                                }
                                MouseArea {
                                    id: rowMouse
                                    anchors.fill: parent
                                    hoverEnabled: true
                                    cursorShape: Qt.PointingHandCursor
                                    onClicked: root.activate(row.index)
                                }
                            }
                        }
                        Column {
                            anchors.centerIn: parent
                            width: parent.width
                            spacing: Style.space(8)
                            visible: root.matches.length === 0
                            Label {
                                width: parent.width
                                text: strings.t("empty")
                                font.pixelSize: Style.font.title
                                horizontalAlignment: Text.AlignHCenter
                            }
                            Label {
                                width: parent.width
                                text: strings.t(root.workspaceOnly ? "emptyScopedHint" : "emptyHint")
                                wrapMode: Text.WordWrap
                                horizontalAlignment: Text.AlignHCenter
                                opacity: 0.65
                            }
                        }
                    }
                    Rectangle {
                        id: previewPane
                        objectName: "overview-preview"
                        readonly property var selectedRow: root.matches[root.selected] || null
                        anchors.top: parent.top
                        anchors.right: parent.right
                        width: body.wide ? parent.width - resultsPane.width - content.gap : parent.width
                        height: body.wide ? body.height : Math.min(Style.space(180), body.height * 0.44)
                        color: Commons.Color.menu.background
                        border.color: Commons.Color.menu.border
                        border.width: 1
                        radius: Style.cornerRadius
                        clip: true
                        Label {
                            id: previewHeading
                            anchors.left: parent.left
                            anchors.right: parent.right
                            anchors.top: parent.top
                            anchors.margins: Style.space(10)
                            text: !body.wide && previewPane.selectedRow
                                ? strings.t("compactPreview").arg(previewPane.selectedRow.app).arg(Commons.I18n.formatNumber(previewPane.selectedRow.workspace))
                                : strings.t("preview")
                            font.pixelSize: Style.font.bodySmall
                            opacity: 0.65
                        }
                        Loader {
                            id: previewLoader
                            objectName: "overview-preview-loader"
                            anchors.left: parent.left
                            anchors.right: parent.right
                            anchors.top: previewHeading.bottom
                            anchors.margins: Style.space(10)
                            height: Math.max(0, previewMetadata.y - y - Style.space(10))
                            active: root.opened && root.matches.length > 0
                            sourceComponent: WindowPreview {
                                address: root.matches[root.selected] ? root.matches[root.selected].address : ""
                                opened: root.opened
                            }
                        }
                        Column {
                            id: previewMetadata
                            height: body.wide ? implicitHeight : 0
                            visible: body.wide
                            anchors.left: parent.left
                            anchors.right: parent.right
                            anchors.bottom: parent.bottom
                            anchors.margins: Style.space(10)
                            spacing: Style.space(4)
                            Label {
                                width: parent.width
                                visible: body.wide
                                text: previewPane.selectedRow ? previewPane.selectedRow.title || previewPane.selectedRow.app : strings.t("selectWindow")
                                font.pixelSize: Style.font.title
                            }
                            Label {
                                id: previewDetails
                                visible: previewPane.selectedRow !== null
                                width: parent.width
                                text: previewPane.selectedRow ? strings.t("detail").arg(previewPane.selectedRow.app).arg(Commons.I18n.formatNumber(previewPane.selectedRow.workspace)) : ""
                                font.pixelSize: Style.font.bodySmall
                                opacity: 0.7
                            }
                        }
                    }
                }
                Label {
                    id: footer
                    anchors.bottom: parent.bottom
                    width: parent.width
                    textFormat: Text.PlainText
                    text: root.actionError ? strings.t(root.actionError) : strings.t("help")
                    wrapMode: Text.WordWrap
                    elide: Text.ElideNone
                    opacity: root.actionError ? 1 : 0.65
                }
            }
        }
    }
}
