export type UserCapabilities = Readonly<{
  canBook: true;
  canProvide: boolean;
}>;

export function resolveUserCapabilities(
  hasProviderProfile: boolean,
): UserCapabilities {
  return {
    canBook: true,
    canProvide: hasProviderProfile,
  };
}
