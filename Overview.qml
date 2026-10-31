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
    property int selected: 0
    property string requestedAddress: ""
    property int requestedWorkspace: 0
    property bool refreshPending: false
    property bool actionPending: false
    property string actionError: ""
    readonly property bool actionBusy: requestedAddress !== "" || verify.running || focusAction.running || actionPending
    readonly property var matches: WindowModel.rows(raw, query)
    onMatchesChanged: selected = Math.max(0, Math.min(selected, matches.length - 1))

    function open(payloadJson) {
        if (opened || opening) return;
        query = ""; selected = 0; raw = "[]"; opening = true;
        lockProbe.start();
    }
    function close() {
        opening = false;
        opened = false; raw = "[]"; query = ""; requestedAddress = ""; requestedWorkspace = 0;
        actionPending = false; actionError = "";
        refreshPending = false; updateTimer.stop();
        lockProbe.cancel(); refresh.cancel(); verify.cancel(); focusAction.cancel();
    }
    function dismiss() {
        close();
        if (shell && manifest) shell.hide(manifest.id);
    }
    function toggle() { if (opened) dismiss(); else open("{}"); }
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

    OverlayWindow {
        id: panel
        shown: root.opened
        onTargetScreenChanged: if (root.opened && !targetScreen) root.dismiss()
        WlrLayershell.namespace: "native-overview"
        Rectangle { anchors.fill: parent; color: Commons.Color.menu.scrim }
        MouseArea { anchors.fill: parent; onClicked: root.dismiss() }
        Rectangle {
            id: card
            anchors.centerIn: parent
            width: Math.min(Style.space(760), panel.width - Style.space(48))
            height: Math.min(Style.space(580), panel.height - Style.space(48))
            color: Commons.Color.menu.background
            border.color: Commons.Color.menu.border
            border.width: 1
            radius: Style.cornerRadius
            MouseArea { anchors.fill: parent; onClicked: {} }
            Item {
                id: keyboard
                anchors.fill: parent
                focus: true
                Keys.onPressed: function(event) {
                    if (event.key === Qt.Key_Escape) root.dismiss();
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
            Column {
                anchors.fill: parent
                anchors.margins: Style.space(20)
                spacing: Style.space(12)
                Text {
                    width: parent.width
                    textFormat: Text.PlainText
                    text: strings.t("title")
                    color: Commons.Color.menu.text
                    font.family: Style.font.menuFamily
                    font.pixelSize: Style.font.heading
                }
                Text {
                    width: parent.width
                    textFormat: Text.PlainText
                    text: root.query || strings.t("search")
                    color: Commons.Color.menu.text
                    opacity: root.query ? 1 : 0.65
                    font.family: Style.font.menuFamily
                    font.pixelSize: Style.font.title
                    elide: Text.ElideRight
                }
                Loader {
                    width: parent.width
                    height: root.matches.length ? Math.min(Style.space(160), card.height * 0.3) : 0
                    active: root.opened && root.matches.length > 0
                    sourceComponent: WindowPreview {
                        address: root.matches[root.selected] ? root.matches[root.selected].address : ""
                        opened: root.opened
                    }
                }
                ListView {
                    id: results
                    width: parent.width
                    height: parent.height - y - Style.space(35)
                    clip: true
                    spacing: Style.space(5)
                    model: root.matches
                    boundsBehavior: Flickable.StopAtBounds
                    delegate: Rectangle {
                        required property var modelData
                        required property int index
                        width: results.width
                        height: Style.space(66)
                        radius: Style.cornerRadius
                        color: index === root.selected ? Commons.Color.menu.selectedBackground : "transparent"
                        Column {
                            anchors.fill: parent
                            anchors.margins: Style.space(10)
                            Text {
                                width: parent.width
                                textFormat: Text.PlainText
                                text: modelData.title || modelData.app
                                color: index === root.selected ? Commons.Color.menu.selectedText : Commons.Color.menu.text
                                font.family: Style.font.menuFamily
                                font.pixelSize: Style.font.title
                                elide: Text.ElideRight
                            }
                            Text {
                                width: parent.width
                                textFormat: Text.PlainText
                                text: strings.t("detail").arg(modelData.app).arg(modelData.workspace)
                                color: index === root.selected ? Commons.Color.menu.selectedText : Commons.Color.menu.text
                                font.family: Style.font.menuFamily
                                font.pixelSize: Style.font.title * 0.8
                                opacity: 0.7
                                elide: Text.ElideRight
                            }
                        }
                        MouseArea {
                            anchors.fill: parent
                            cursorShape: Qt.PointingHandCursor
                            onClicked: root.activate(index)
                        }
                    }
                    Text {
                        anchors.centerIn: parent
                        textFormat: Text.PlainText
                        text: strings.t("empty")
                        visible: root.matches.length === 0
                        color: Commons.Color.menu.text
                        font.family: Style.font.menuFamily
                    }
                }
                Text {
                    width: parent.width
                    textFormat: Text.PlainText
                    text: root.actionError ? strings.t(root.actionError) : strings.t("help")
                    elide: Text.ElideRight
                    color: Commons.Color.menu.text
                    opacity: 0.6
                    font.family: Style.font.menuFamily
                }
            }
        }
    }
}
