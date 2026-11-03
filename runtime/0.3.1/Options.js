// SPDX-License-Identifier: GPL-3.0-only
function defaults() { return {defaultScope:"all", sortOrder:"existing", thumbnails:true}; }
function valid(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value)
        && Object.keys(value).sort().join(",") === "defaultScope,sortOrder,thumbnails"
        && ["all", "current"].indexOf(value.defaultScope) !== -1
        && ["existing", "name", "workspace"].indexOf(value.sortOrder) !== -1
        && typeof value.thumbnails === "boolean";
}
function decode(text) {
    if (typeof text !== "string" || text.length > 16384) return null;
    try {
        var reply = JSON.parse(text);
        return reply && reply.ok === true && valid(reply.options) ? reply.options : null;
    } catch (e) { return null; }
}
function command(path, verb, value) {
    if (["read", "save", "reset"].indexOf(verb) === -1 || (verb === "save" && !valid(value))) return null;
    var argv = ["/usr/bin/python3", "-B", path, verb];
    return verb === "save" ? argv.concat([JSON.stringify(value)]) : argv;
}
