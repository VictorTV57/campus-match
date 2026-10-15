const REQUIRED = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

/**
 * Échoue au démarrage plutôt qu'à la première requête si une variable
 * d'environnement obligatoire manque.
 */
export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED.filter((key) => {
    const value = config[key];
    return typeof value !== 'string' || value.length === 0;
  });

  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes : ${missing.join(', ')}. ` +
        'Voir back/.env.example',
    );
  }

  if (config['JWT_ACCESS_SECRET'] === config['JWT_REFRESH_SECRET']) {
    throw new Error(
      'JWT_ACCESS_SECRET et JWT_REFRESH_SECRET doivent être différents : ' +
        'sinon un refresh token est accepté comme access token.',
    );
  }

  return config;
}
