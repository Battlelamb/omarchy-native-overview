// SPDX-License-Identifier: GPL-3.0-only
// Native settings composition adapted from our GPL Lego Settings.qml; options only.
import QtQuick
import QtQuick.Layouts
import qs.Ui
import qs.Commons
import qs.Commons as Commons
import "Options.js" as Options

Item {
    id: root
    property var options: Options.defaults()
    property var draft: Options.defaults()
    property bool busy: false
    property string status: ""
    signal saveRequested(var value)
    signal resetRequested()
    signal backRequested()
    onOptionsChanged: reload()
    Keys.onEscapePressed: root.backRequested()
    function reload() { draft = Object.assign({}, options); }
    function edit(key, value) {
        var next = Object.assign({}, draft); next[key] = value;
        if (Options.valid(next)) draft = next;
    }
    function save() { if (!busy && Options.valid(draft)) saveRequested(draft); }
    function closePopups() { scope.close(); order.close(); }
    function focusFirst() {
        function visit(item) {
            if (item.activeFocusOnTab) { item.forceActiveFocus(); return true; }
            for (var i=0; i<item.children.length; i++) if (visit(item.children[i])) return true;
            return false;
        }
        Qt.callLater(function() { if (root.visible) visit(scope); });
    }
    Connections {
        target: root.Window.window
        function onActiveFocusItemChanged() {
            if (!root.visible) return;
            var item = root.Window.window.activeFocusItem;
            var ancestor = item;
            while (ancestor && ancestor !== fields) ancestor = ancestor.parent;
            if (ancestor === fields) {
                var control = item;
                while (control.parent !== fields) control = control.parent;
                scroll.reveal(control);
            }
        }
    }
    component Label: Text {
        textFormat: Text.PlainText
        color: Commons.Color.menu.text
        font.family: Style.font.menuFamily
        font.pixelSize: Style.font.body
        wrapMode: Text.WordWrap
    }
    ColumnLayout {
        anchors.fill: parent
        spacing: Style.space(10)
        Label { text: "Configure Overview"; font.pixelSize: Style.font.heading; font.bold: true; Layout.fillWidth: true }
        Flickable {
            id: scroll
            objectName: "overview-settings-scroll"
            Layout.fillWidth: true
            Layout.fillHeight: true
            contentHeight: fields.implicitHeight
            clip: true
            boundsBehavior: Flickable.StopAtBounds
            function reveal(item) {
                var point = item.mapToItem(fields, 0, 0);
                contentY = Math.max(0, Math.min(Math.max(0, contentHeight-height), point.y + item.height - height));
            }
            Column {
                id: fields
                width: parent.width
                spacing: Style.space(10)
                Label { width: parent.width; text: "Default workspace scope" }
                Dropdown {
                    id: scope
                    objectName: "overview-option-defaultScope"
                    width: parent.width
                    showLabel: false
                    fontFamily: Style.font.menuFamily
                    rowHeight: Math.max(Style.spacing.controlHeight, scopeMetrics.height + Style.space(14))
                    popupRowHeight: rowHeight
                    options: [{value:"all",label:"All workspaces"},{value:"current",label:"Current workspace"}]
                    value: root.draft.defaultScope
                    enabled: !root.busy
                    Accessible.name: "Default workspace scope"
                    onChanged: value => root.edit("defaultScope", value)
                    onActiveFocusChanged: if (activeFocus) scroll.reveal(scope)
                }
                FontMetrics { id: scopeMetrics; font.family: Style.font.menuFamily; font.pixelSize: Style.font.body }
                Label { width: parent.width; text: "Window order" }
                Dropdown {
                    id: order
                    objectName: "overview-option-sortOrder"
                    width: parent.width
                    showLabel: false
                    fontFamily: Style.font.menuFamily
                    rowHeight: scope.rowHeight
                    popupRowHeight: rowHeight
                    options: [{value:"existing",label:"Existing order"},{value:"name",label:"Application / title"},{value:"workspace",label:"Workspace / application / title"}]
                    value: root.draft.sortOrder
                    enabled: !root.busy
                    Accessible.name: "Window order"
                    onChanged: value => root.edit("sortOrder", value)
                    onActiveFocusChanged: if (activeFocus) scroll.reveal(order)
                }
                Toggle {
                    id: thumbnails
                    objectName: "overview-option-thumbnails"
                    width: parent.width
                    label: "Selected-window thumbnail"
                    description: "Off releases the preview and uses the full list width."
                    fontFamily: Style.font.menuFamily
                    checked: root.draft.thumbnails
                    enabled: !root.busy
                    Accessible.name: label
                    Accessible.role: Accessible.CheckBox
                    Accessible.checkable: true
                    Accessible.checked: checked
                    Accessible.onToggleAction: root.edit("thumbnails", !checked)
                    onClicked: root.edit("thumbnails", !checked)
                    onActiveFocusChanged: if (activeFocus) scroll.reveal(thumbnails)
                }
                Label { width: parent.width; text: "Save applies these options now and on the next open. Reset changes only Overview options. Escape returns without saving."; font.pixelSize: Style.font.bodySmall; opacity: 0.7 }
            }
        }
        Label { Layout.fillWidth: true; visible: root.status.length > 0; text: root.status }
        Flow {
            Layout.fillWidth: true
            spacing: Style.space(8)
            Button { objectName: "overview-settings-save"; text: "Save settings"; fontFamily: Style.font.menuFamily; focusable: true; bordered: true; enabled: !root.busy; onClicked: root.save() }
            Button { objectName: "overview-settings-reset"; text: "Reset"; fontFamily: Style.font.menuFamily; focusable: true; bordered: true; enabled: !root.busy; onClicked: root.resetRequested() }
            Button { objectName: "overview-settings-back"; text: "Back"; fontFamily: Style.font.menuFamily; focusable: true; enabled: !root.busy; onClicked: root.backRequested() }
        }

    }
}
