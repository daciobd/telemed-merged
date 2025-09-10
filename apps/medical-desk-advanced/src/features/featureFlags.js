const asArray = (v) => Array.isArray(v) ? v : [];

const normalizeFlag = (flag = {}) => ({
  ...flag,
  users: asArray(flag.users),
  roles: asArray(flag.roles),
  tenants: asArray(flag.tenants),
});

export default function initializeFeatureFlags() {
  // Carregaria de DB/ENV; aqui vazio e seguro:
  let flags = [];
  flags = flags.map(normalizeFlag);

  const getFeatureFlagsStats = () => flags.map(f => ({
    key: f.key ?? "unknown",
    enabled: !!f.enabled,
    hasUsers: f.users.length > 0,
  }));

  return { getFeatureFlagsStats };
}
