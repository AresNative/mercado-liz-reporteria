// assets/images/index.ts
// Opción 1: Logo en Base64 (simplificado para el ejemplo)
export const CompanyLogo = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiMwMDY2Q0MiLz48dGV4dCB4PSI1MCIgeT0iNTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiPkxPR088L3RleHQ+PC9zdmc+`;

// Opción 2: Función para obtener logo de la carpeta public
export const getLogoURL = (): string => {
  // Asegúrate de que el archivo exista en public/logo.png
  return "/logo.png"; // Ruta relativa a tu logo en public
};

// Opción 3: Logo como módulo de imagen (requiere configuración de webpack)
// import logo from './logo.png';
// export { logo as CompanyLogo };
