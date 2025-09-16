import { v4 as uuidv4, v5 as uuidv5, validate, version } from "uuid";

class UUIDGenerator {
  static generate(): string {
    return uuidv4();
  }

  static generateFromName(name: string, namespace?: string): string {
    const defaultNamespace = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    return uuidv5(name, namespace || defaultNamespace);
  }

  static isValid(uuid: string): boolean {
    return validate(uuid);
  }

  static getVersion(uuid: string): number | null {
    return validate(uuid) ? version(uuid) : null;
  }

  static generateBatch(count: number): string[] {
    return Array.from({ length: count }, () => uuidv4());
  }
}

/* 
* Ejemplos de uso
const singleId = UUIDGenerator.generate();
const namedId = UUIDGenerator.generateFromName("usuario-123");
const isValid = UUIDGenerator.isValid(singleId);
const idsBatch = UUIDGenerator.generateBatch(5); 
*/
export default UUIDGenerator;
