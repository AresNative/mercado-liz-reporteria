import { MongoClient, Collection, ObjectId, Filter, Document } from "mongodb";
import clientPromise from "@/utils/constants/mongodb-config";

export type QueryConstraint = {
  field: string;
  operator: "==" | ">" | "<" | ">=" | "<=" | "array-contains" | "in";
  value: any;
};

export class MongoDBService<T extends { id: string }> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  private async getCollection(): Promise<Collection<Document>> {
    const client = await clientPromise;
    return client.db().collection(this.collectionName);
  }

  private toEntity(doc: Document): T {
    const { _id, ...rest } = doc;
    return { ...rest, id: _id.toString() } as T;
  }

  private toObjectId(id: string): ObjectId {
    return new ObjectId(id);
  }

  private buildFilter(constraints: QueryConstraint[]): Filter<Document> {
    const filter: Filter<Document> = {};
    for (const c of constraints) {
      if (c.operator === "==") {
        filter[c.field] = c.value;
      } else {
        console.warn(`Operador ${c.operator} no implementado, se omite.`);
      }
    }
    return filter;
  }

  private stripUndefined(obj: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined),
    );
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    const collection = await this.getCollection();
    const filter = this.buildFilter(constraints);
    const cursor =
      Object.keys(filter).length > 0
        ? collection.find(filter)
        : collection.find();
    const docs = await cursor.toArray();
    return docs.map((doc) => this.toEntity(doc));
  }

  async getById(id: string): Promise<T | null> {
    const collection = await this.getCollection();
    const doc = await collection.findOne({ _id: this.toObjectId(id) });
    return doc ? this.toEntity(doc) : null;
  }

  async create(data:any): Promise<string> {
    const collection = await this.getCollection();
    const cleanData = this.stripUndefined(data);
    const result = await collection.insertOne({
      ...cleanData,
      createdAt: new Date(),
    });
    return result.insertedId.toString();
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    const collection = await this.getCollection();
    const cleanData = this.stripUndefined(data);
    await collection.updateOne(
      { _id: this.toObjectId(id) },
      { $set: { ...cleanData, updatedAt: new Date() } },
    );
  }

  async delete(id: string): Promise<void> {
    const collection = await this.getCollection();
    await collection.deleteOne({ _id: this.toObjectId(id) });
  }
}
