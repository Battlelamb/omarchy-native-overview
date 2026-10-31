// SPDX-License-Identifier: GPL-3.0-only
import QtQuick
import Quickshell
import Quickshell.Io
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
    readonly property var matches: WindowModel.rows(raw, query)
    onMatchesChanged: selected = Math.max(0, Math.min(selected, matches.length - 1))

    function open(payloadJson) {
        if (opened || opening) return;
        // A cancelled probe must finish before another admission can use its result.
        if (lockProbe.running) { dismiss(); return; }
        query = ""; selected = 0; raw = "[]"; opening = true;
        lockProbe.running = true;
    }
    function close() {
        opening = false;
        opened = false; raw = "[]"; query = ""; requestedAddress = ""; requestedWorkspace = 0;
        refresh.running = false; verify.running = false; updateTimer.stop();
    }
    function dismiss() {
        close();
        if (shell && manifest) shell.hide(manifest.id);
    }
    function toggle() { if (opened) dismiss(); else open("{}"); }
    function activate(index, bringHere) {
        if (!opened || index < 0 || index >= matches.length || verify.running || focusAction.running) return;
        if (bringHere && (!Hyprland.focusedWorkspace || Hyprland.focusedWorkspace.id < 1)) return;
        requestedAddress = matches[index].address;
        requestedWorkspace = bringHere ? Hyprland.focusedWorkspace.id : 0;
        verify.running = true;
    }

    // shortcut: compositor lock state is sampled while open; replace polling if a lock event API appears.
    Timer {
        interval: 250; repeat: true; running: root.opened
        onTriggered: if (!lockProbe.running) lockProbe.running = true
    }
    Process {
        id: lockProbe
        command: ["/usr/bin/timeout", "--kill-after=1", "2", "/usr/bin/omarchy-hyprland-session-locked"]
        onExited: (code, status) => {
            if (!root.opening && !root.opened) return;
            if (code !== 1 || status !== 0) { root.dismiss(); return; }
            if (root.opening) {
                root.opening = false; root.opened = true;
                refresh.running = true;
                Qt.callLater(function() { if (root.opened) keyboard.forceActiveFocus(); });
            }
        }
    }
    Commons.Translations { id: strings; directory: Qt.resolvedUrl("i18n") }
    Timer { id: updateTimer; interval: 80; onTriggered: if (root.opened && !refresh.running) refresh.running = true }
    Connections {
        target: Hyprland
        function onRawEvent(event) { if (root.opened) updateTimer.restart(); }
    }
    Process {
        id: refresh
        command: ["/usr/bin/hyprctl", "clients", "-j"]
        stdout: StdioCollector { onStreamFinished: if (root.opened) root.raw = text }
        onExited: (code, status) => { if (code !== 0 && root.opened) root.raw = "[]"; }
    }
    Process {
        id: verify
        command: ["/usr/bin/hyprctl", "clients", "-j"]
        stdout: StdioCollector { id: verifiedClients }
        onExited: (code, status) => {
            if (!root.opened || code !== 0) return;
            var request = root.requestedWorkspace > 0
                ? WindowModel.moveRequest(root.requestedAddress, root.requestedWorkspace, verifiedClients.text)
                : WindowModel.focusRequest(root.requestedAddress, verifiedClients.text);
            root.requestedAddress = "";
            if (!request) { refresh.running = true; return; }
            root.dismiss();
            focusAction.command = ["/usr/bin/hyprctl", "dispatch", request];
            focusAction.running = true;
        }
    }
    Process { id: focusAction }

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
                    text: strings.t("help")
                    color: Commons.Color.menu.text
                    opacity: 0.6
                    font.family: Style.font.menuFamily
                }
            }
        }
    }
}
