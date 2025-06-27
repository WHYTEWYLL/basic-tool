/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      if (isServer) {
        config.externals = config.externals || [];
        config.externals.push({
          '@prisma/client': 'commonjs @prisma/client',
          '.prisma/vector-client': 'commonjs .prisma/vector-client',
        });
      }
      return config;
    },
  };
  
  export default nextConfig;
  