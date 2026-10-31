// SPDX-License-Identifier: GPL-3.0-only
// Adapted from end-4/dots-hyprland OverviewWindow.qml at 2f2a376fdb2ad738bf55f693dd0b474b64bb0ab8.
// Copyright end-4 and contributors; lifecycle-bound ScreencopyView retained, shell-specific geometry/effects removed.
import QtQuick
import Quickshell.Wayland
import Quickshell.Hyprland
import qs.Commons as Commons

Item {
    id: root
    property string address: ""
    property bool opened: false
    Component.onCompleted: console.info("native-overview preview-created")
    Component.onDestruction: console.info("native-overview preview-destroyed")
    readonly property var toplevel: {
        var windows = ToplevelManager.toplevels.values;
        for (var i = 0; i < windows.length; i++) {
            var handle = windows[i].HyprlandToplevel;
            if (handle && "0x" + String(handle.address).replace(/^0x/, "") === root.address) return windows[i];
        }
        return null;
    }
    Commons.Translations { id: strings; directory: Qt.resolvedUrl("i18n") }
    ScreencopyView {
        id: capture
        anchors.fill: parent
        captureSource: root.opened ? root.toplevel : null
        live: true
    }
    Text {
        anchors.centerIn: parent
        visible: !capture.hasContent
        text: strings.t("previewUnavailable")
        textFormat: Text.PlainText
        color: Commons.Color.menu.text
    }
}
