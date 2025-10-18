import type { NextConfig } from "next";
import webpack from "webpack";
import path from "path";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: [
      "@huddle01/react",
      "@xmtp/browser-sdk",
      "@rainbow-me/rainbowkit",
    ],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "via.placeholder.com", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", pathname: "/**" },
      { protocol: "https", hostname: "gateway.pinata.cloud", pathname: "/**" },
      { protocol: "https", hostname: "ipfs.io", pathname: "/**" },
      { protocol: "https", hostname: "cloudflare-ipfs.com", pathname: "/**" },
      { protocol: "https", hostname: "lh3.googleusercontent.com", pathname: "/**" },
      { protocol: "http", hostname: "localhost", port: "3000", pathname: "/uploads/**" },
      { protocol: "http", hostname: "127.0.0.1", port: "3000", pathname: "/uploads/**" },
    ],
  },

  webpack: (config, { isServer, dev }) => {
    // Use non-eval source maps in development to comply with strict CSP/Trusted Types
    if (dev) {
      config.devtool = 'cheap-module-source-map';
    }
    // --- WASM support ---
    config.experiments = { ...config.experiments, asyncWebAssembly: true };

    // Chunk splitting to avoid ChunkLoadError
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          chunks: "all",
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            huddle: {
              test: /[\\/]node_modules[\\/]@huddle01[\\/]/,
              name: "huddle",
              chunks: "all",
              priority: 20,
            },
            xmtp: {
              test: /[\\/]node_modules[\\/]@xmtp[\\/]/,
              name: "xmtp",
              chunks: "all",
              priority: 20,
            },
            rainbowkit: {
              test: /[\\/]node_modules[\\/]@rainbow-me[\\/]/,
              name: "rainbowkit",
              chunks: "all",
              priority: 20,
            },
            wagmi: {
              test: /[\\/]node_modules[\\/](wagmi|viem)[\\/]/,
              name: "wagmi",
              chunks: "all",
              priority: 20,
            },
          },
        },
      };
    }

    // XMTP wasm as plain asset
    config.module.rules.push({
      test: /@xmtp[\\/](browser-sdk[\\/]node_modules[\\/])?@xmtp[\\/]wasm-bindings[\\/]dist[\\/]bindings_wasm_bg\.wasm$/,
      type: "asset/resource",
      generator: { filename: "static/wasm/[hash][ext][query]" },
    });

    // General wasm (exclude XMTP target above)
    config.module.rules.push({
      test: /\.wasm$/,
      type: "webassembly/async",
      exclude: /@xmtp[\\/](browser-sdk[\\/]node_modules[\\/])?@xmtp[\\/]wasm-bindings[\\/]dist[\\/]bindings_wasm_bg\.wasm$/,
    });

    // Aliases for BOTH server & client
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": path.resolve(
        __dirname,
        "stubs/asyncStorage.web.js"
      ),
      "pino-pretty": path.resolve(__dirname, "stubs/pino-pretty.js"),
      wbg: path.resolve(__dirname, "stubs/wbg.js"),
    };

    // Silence asyncWebAssembly warning from XMTP
    config.ignoreWarnings = [
      {
        module: /bindings_wasm_bg\.wasm$/,
        message: /async\/await/,
      },
    ];

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        url: require.resolve("url"),
        zlib: require.resolve("browserify-zlib"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        assert: require.resolve("assert"),
        os: require.resolve("os-browserify"),
        path: require.resolve("path-browserify"),
        buffer: require.resolve("buffer"),
      };

      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
          process: "process/browser",
        })
      );
    }

    return config;
  },
};

export default nextConfig;