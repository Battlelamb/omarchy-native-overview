// SPDX-License-Identifier: GPL-3.0-only
function validClients(raw) {
    if (typeof raw !== "string" || raw.length > 1048576) return [];
    var clients;
    try { clients = JSON.parse(raw); } catch (e) { return []; }
    if (!Array.isArray(clients)) return [];
    return clients.filter(function(c) {
        return c && c.mapped === true && /^0x[0-9a-fA-F]{1,16}$/.test(c.address)
            && c.workspace && Number.isInteger(c.workspace.id) && Number.isInteger(c.monitor)
            && typeof c.title === "string" && typeof c.class === "string";
    }).map(function(c) {
        return {address:c.address, title:c.title.slice(0, 512), app:c.class.slice(0, 128), workspace:c.workspace.id, monitor:c.monitor};
    });
}
function rows(raw, query) {
    var needle = String(query || "").slice(0, 256).toLowerCase();
    return validClients(raw).filter(function(c) {
        return (c.title + " " + c.app).toLowerCase().indexOf(needle) !== -1;
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
