import type { Expense } from "@/types";

const DB_NAME = "al-muhaasib-pending";
const DB_VERSION = 1;
const STORE_NAME = "pending-expenses";

class PendingExpenseStore {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("status", "status", { unique: false });
          store.createIndex("recordedBy", "recordedBy", { unique: false });
          store.createIndex("createdAt", "createdAt", { unique: false });
        }
      };
    });
  }

  private async ensureDb(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error("Failed to initialize database");
    }
    return this.db;
  }

  /**
   * Add a pending expense to local storage
   */
  async addPending(
    expense: Omit<Expense, "createdAt" | "updatedAt"> & {
      createdAt: bigint;
      updatedAt: bigint;
    },
  ): Promise<void> {
    const db = await this.ensureDb();

    // Convert bigint to number for IndexedDB storage
    const expenseToStore = {
      ...expense,
      createdAt: Number(expense.createdAt),
      updatedAt: Number(expense.updatedAt),
      approvedAt: expense.approvedAt ? Number(expense.approvedAt) : undefined,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(expenseToStore);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all pending expenses
   */
  async getAllPending(): Promise<Expense[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        type StoredExpense = Omit<Expense, 'createdAt' | 'updatedAt' | 'approvedAt'> & { createdAt: number; updatedAt: number; approvedAt?: number };
        const expenses = (request.result as StoredExpense[]).map((exp) => ({
          ...exp,
          // Convert back to bigint (stored as millis or nanos number)
          createdAt: BigInt(exp.createdAt),
          updatedAt: BigInt(exp.updatedAt),
          approvedAt: exp.approvedAt !== undefined ? BigInt(exp.approvedAt) : undefined,
        }));
        resolve(expenses as unknown as Expense[]);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get pending expenses by status
   */
  async getByStatus(
    status: "pending" | "approved" | "rejected",
  ): Promise<Expense[]> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index("status");
      const request = index.getAll(status);

      request.onsuccess = () => {
        type StoredExpense = Omit<Expense, 'createdAt' | 'updatedAt' | 'approvedAt'> & { createdAt: number; updatedAt: number; approvedAt?: number };
        const expenses = (request.result as StoredExpense[]).map((exp) => ({
          ...exp,
          createdAt: BigInt(exp.createdAt),
          updatedAt: BigInt(exp.updatedAt),
          approvedAt: exp.approvedAt !== undefined ? BigInt(exp.approvedAt) : undefined,
        }));
        resolve(expenses as unknown as Expense[]);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single pending expense by ID
   */
  async getById(id: string): Promise<Expense | null> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          const exp = request.result;
          resolve({
            ...exp,
            createdAt: BigInt(exp.createdAt),
            updatedAt: BigInt(exp.updatedAt),
            approvedAt: exp.approvedAt ? BigInt(exp.approvedAt) : undefined,
          });
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update a pending expense
   */
  async update(id: string, updates: Partial<Expense>): Promise<void> {
    const db = await this.ensureDb();
    const existing = await this.getById(id);

    if (!existing) {
      throw new Error("Pending expense not found");
    }

    const updated = {
      ...existing,
      ...updates,
      // Convert bigint for storage
      createdAt: Number(existing.createdAt),
      updatedAt: Number(BigInt(Date.now()) * BigInt(1_000_000)),
      approvedAt: updates.approvedAt
        ? Number(updates.approvedAt)
        : existing.approvedAt
          ? Number(existing.approvedAt)
          : undefined,
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(updated);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a pending expense (after it's been saved to Juno or rejected)
   */
  async delete(id: string): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all pending expenses
   */
  async clear(): Promise<void> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count pending expenses
   */
  async count(): Promise<number> {
    const db = await this.ensureDb();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const pendingExpenseStore = new PendingExpenseStore();
