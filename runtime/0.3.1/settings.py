# SPDX-License-Identifier: GPL-3.0-only
"""Overview options only: no client data, commands or external actions."""
import json
import sys

import preferences

SLUG = 'native-overview'
SCHEMA = {
    'defaultScope': {'type':'enum', 'default':'all', 'choices':['all', 'current']},
    'sortOrder': {'type':'enum', 'default':'existing', 'choices':['existing', 'name', 'workspace']},
    'thumbnails': {'type':'boolean', 'default':True},
}


def main(args):
    if args == ['read']:
        result = preferences.read(SLUG, SCHEMA)
    elif len(args) == 2 and args[0] == 'save':
        if len(args[1].encode('utf-8')) > 16384:
            raise ValueError('Settings payload exceeds 16 KiB')
        options = json.loads(args[1], object_pairs_hook=preferences._pairs,
                             parse_constant=lambda _: (_ for _ in ()).throw(ValueError('Invalid number')))
        result = preferences.change(SLUG, SCHEMA, {'options': options})
    elif args == ['reset']:
        # Reset this editor's options under the same lock; retain unrelated legacy data.
        result = preferences.change(SLUG, SCHEMA, {'options': {key: spec['default'] for key, spec in SCHEMA.items()}})
    else:
        raise ValueError('Use read, save <options JSON>, or reset')
    return {'ok':True, 'options':result['options']}


if __name__ == '__main__':
    try:
        reply = main(sys.argv[1:])
    except (ValueError, OSError, UnicodeError, RecursionError):
        print(preferences.encode_reply({'ok':False, 'message':'Cannot read or save Overview settings; check the private preferences file and retry.'}))
        sys.exit(1)
    print(preferences.encode_reply(reply))
