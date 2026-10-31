// SPDX-License-Identifier: GPL-3.0-only
function fitsInputLimit(raw) {
    var limit = 1048576;
    if (typeof raw !== "string" || raw.length > limit) return false;
    // Every UTF-16 unit needs at most three UTF-8 bytes; normal lists need no scan.
    if (raw.length * 3 <= limit) return true;
    var first = /[^\x00-\x7f]/.exec(raw);
    if (!first) return true;
    var bytes = raw.length;
    for (var i = first.index; i < raw.length; i++) {
        var code = raw.charCodeAt(i);
        if (code < 128) continue;
        bytes += code < 2048 ? 1 : 2;
        if (code >= 0xd800 && code <= 0xdbff && i + 1 < raw.length) {
            var next = raw.charCodeAt(i + 1);
            if (next >= 0xdc00 && next <= 0xdfff) i++;
        }
        if (bytes > limit) return false;
    }
    return true;
}
function validClients(raw) {
    if (!fitsInputLimit(raw)) return [];
    var clients;
    try { clients = JSON.parse(raw); } catch (e) { return []; }
    if (!Array.isArray(clients)) return [];
    return clients.filter(function(c) {
        return c && c.mapped === true && typeof c.address === "string" && /^0x[0-9a-fA-F]{1,16}$/.test(c.address)
            && c.workspace && Number.isInteger(c.workspace.id) && Number.isInteger(c.monitor)
            && typeof c.title === "string" && typeof c.class === "string";
    }).map(function(c) {
        return {address:c.address, title:c.title.slice(0, 512), app:c.class.slice(0, 128), workspace:c.workspace.id, monitor:c.monitor};
    });
}
function rows(raw, query, workspace) {
    return filterRows(validClients(raw), query, workspace);
}
function filterRows(clients, query, workspace) {
    if (workspace !== undefined && !Number.isInteger(workspace)) return [];
    var words = String(query || "").slice(0, 256).toLowerCase().trim().split(/\s+/);
    return clients.filter(function(c) {
        if (workspace !== undefined && c.workspace !== workspace) return false;
        var text = (c.title + " " + c.app).toLowerCase();
        return words.every(function(word) { return text.indexOf(word) !== -1; });
    }).slice(0, 256);
}
function focusRequest(address, raw) {
    var found = validClients(raw).some(function(c) { return c.address === address; });
    return found ? 'hl.dsp.focus({ window = "address:' + address + '" })' : "";
}
function moveRequest(address, workspace, raw) {
    if (!Number.isInteger(workspace) || workspace < 1 || workspace > 9999 || !focusRequest(address, raw)) return "";
    return 'hl.dsp.window.move({ workspace = ' + workspace + ', follow = false, window = "address:' + address + '" })';
}
