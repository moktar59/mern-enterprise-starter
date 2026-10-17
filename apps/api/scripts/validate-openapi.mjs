import { readFile } from 'node:fs/promises';
import SwaggerParser from '@apidevtools/swagger-parser';

const specificationPath = new URL('../openapi/openapi.yaml', import.meta.url);
const specification = await readFile(specificationPath, 'utf8');

try {
  const api = await SwaggerParser.validate(specificationPath.pathname);
  if (api.openapi !== '3.1.0') {
    throw new Error(`Expected OpenAPI 3.1.0, received ${api.openapi ?? 'no version'}`);
  }
  console.log(`OpenAPI ${api.openapi} specification is valid: ${api.info.title}`);
} catch (error) {
  console.error('OpenAPI specification validation failed.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
