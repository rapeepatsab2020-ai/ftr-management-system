const bp = process.env.NEXT_PUBLIC_BASE_PATH || '';
export default { output: 'export', basePath: bp, images: { unoptimized: true } };
