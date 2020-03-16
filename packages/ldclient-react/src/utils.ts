import { LDFlagSet } from 'ldclient-js';
import camelCase from 'lodash.camelcase';

export const camelCaseKeys = (rawFlags: LDFlagSet) => {
  const flags: LDFlagSet = {};
  for (const rawFlag in rawFlags) {
    // Exclude system keys
    if (!rawFlag.startsWith('$')) {
      const camelCasedKey = camelCase(rawFlag);
      flags[camelCasedKey] = rawFlags[rawFlag];
    }
  }

  return flags;
};
