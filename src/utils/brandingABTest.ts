/**
 * BRANDING A/B TESTING
 *
 * System for testing different brand color schemes and tracking user preferences.
 * Allows schools to experiment with colors before committing.
 */

import { setDoc, getDoc, listDocs } from "@junobuild/core";
import { nanoid } from "nanoid";

export interface ColorVariant {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description?: string;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ColorVariant[];
  status: "draft" | "active" | "completed";
  startDate: string;
  endDate?: string;
  createdAt: bigint;
  updatedAt: bigint;
  createdBy: string;
}

export interface ABTestResult {
  id: string;
  testId: string;
  variantId: string;
  userId: string;
  timestamp: bigint;
  sessionDuration?: number;
  interactions?: number;
  feedback?: "positive" | "neutral" | "negative";
  comments?: string;
}

const AB_TEST_COLLECTION = "ab_tests";
const AB_RESULT_COLLECTION = "ab_test_results";

/**
 * Create a new A/B test
 */
export async function createABTest(
  name: string,
  description: string,
  variants: Omit<ColorVariant, "id">[],
  userId: string,
): Promise<ABTest> {
  const id = nanoid();
  const nowNanos = BigInt(Date.now()) * BigInt(1_000_000);

  const test: ABTest = {
    id,
    name,
    description,
    variants: variants.map((v) => ({ ...v, id: nanoid() })),
    status: "draft",
    startDate: new Date().toISOString(),
    createdAt: nowNanos,
    updatedAt: nowNanos,
    createdBy: userId,
  };

  await setDoc({
    collection: AB_TEST_COLLECTION,
    doc: {
      key: id,
      data: serializeBigInt(test),
      description: `A/B Test: ${name}`,
      version: undefined,
    },
  });

  return test;
}

/**
 * Get active A/B test (if any)
 */
export async function getActiveTest(): Promise<ABTest | null> {
  try {
    const docs = await listDocs({
      collection: AB_TEST_COLLECTION,
      filter: {},
    });

    const activeTest = docs.items.find(
      (doc) => (doc.data as ABTest).status === "active",
    );

    if (!activeTest) return null;

    return deserializeBigInt(activeTest.data) as ABTest;
  } catch (error) {
    console.error("Error getting active test:", error);
    return null;
  }
}

/**
 * Start an A/B test
 */
export async function startABTest(testId: string): Promise<void> {
  const doc = await getDoc({
    collection: AB_TEST_COLLECTION,
    key: testId,
  });

  if (!doc) {
    throw new Error("Test not found");
  }

  const test = deserializeBigInt(doc.data) as ABTest;

  await setDoc({
    collection: AB_TEST_COLLECTION,
    doc: {
      key: testId,
      data: serializeBigInt({
        ...test,
        status: "active",
        startDate: new Date().toISOString(),
        updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
      }),
      description: doc.description,
      version: doc.version,
    },
  });
}

/**
 * End an A/B test
 */
export async function endABTest(testId: string): Promise<void> {
  const doc = await getDoc({
    collection: AB_TEST_COLLECTION,
    key: testId,
  });

  if (!doc) {
    throw new Error("Test not found");
  }

  const test = deserializeBigInt(doc.data) as ABTest;

  await setDoc({
    collection: AB_TEST_COLLECTION,
    doc: {
      key: testId,
      data: serializeBigInt({
        ...test,
        status: "completed",
        endDate: new Date().toISOString(),
        updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
      }),
      description: doc.description,
      version: doc.version,
    },
  });
}

/**
 * Record user interaction with a variant
 */
export async function recordVariantInteraction(
  testId: string,
  variantId: string,
  userId: string,
  data?: {
    sessionDuration?: number;
    interactions?: number;
    feedback?: "positive" | "neutral" | "negative";
    comments?: string;
  },
): Promise<void> {
  const id = nanoid();
  const nowNanos = BigInt(Date.now()) * BigInt(1_000_000);

  const result: ABTestResult = {
    id,
    testId,
    variantId,
    userId,
    timestamp: nowNanos,
    ...data,
  };

  await setDoc({
    collection: AB_RESULT_COLLECTION,
    doc: {
      key: id,
      data: serializeBigInt(result),
      description: `A/B Test Result: ${testId}`,
      version: undefined,
    },
  });
}

/**
 * Get A/B test results
 */
export async function getTestResults(testId: string): Promise<{
  totalResponses: number;
  variantResults: Record<
    string,
    {
      views: number;
      positive: number;
      neutral: number;
      negative: number;
      avgSessionDuration: number;
      comments: string[];
    }
  >;
}> {
  const docs = await listDocs({
    collection: AB_RESULT_COLLECTION,
    filter: {},
  });

  const results = docs.items
    .map((doc) => deserializeBigInt(doc.data) as ABTestResult)
    .filter((r) => r.testId === testId);

  const variantResults: Record<string, {
    views: number;
    positive: number;
    neutral: number;
    negative: number;
    totalDuration: number;
    durationCount: number;
    avgSessionDuration: number;
    comments: string[];
  }> = {};

  results.forEach((result) => {
    if (!variantResults[result.variantId]) {
      variantResults[result.variantId] = {
        views: 0,
        positive: 0,
        neutral: 0,
        negative: 0,
        totalDuration: 0,
        durationCount: 0,
        avgSessionDuration: 0,
        comments: [],
      };
    }

    const variant = variantResults[result.variantId];
    variant.views++;

    if (result.feedback === "positive") variant.positive++;
    if (result.feedback === "neutral") variant.neutral++;
    if (result.feedback === "negative") variant.negative++;

    if (result.sessionDuration) {
      variant.totalDuration += result.sessionDuration;
      variant.durationCount++;
    }

    if (result.comments) {
      variant.comments.push(result.comments);
    }
  });

  // Calculate averages
  Object.keys(variantResults).forEach((variantId) => {
    const variant = variantResults[variantId];
    variant.avgSessionDuration =
      variant.durationCount > 0
        ? variant.totalDuration / variant.durationCount
        : 0;
    delete variant.totalDuration;
    delete variant.durationCount;
  });

  return {
    totalResponses: results.length,
    variantResults,
  };
}

/**
 * Get winning variant based on results
 */
export async function getWinningVariant(testId: string): Promise<{
  variantId: string;
  score: number;
  metrics: {
    positiveRate: number;
    avgSessionDuration: number;
    totalViews: number;
  };
} | null> {
  const results = await getTestResults(testId);

  if (results.totalResponses === 0) return null;

  let winner: {
    variantId: string;
    score: number;
    metrics: {
      positiveRate: number;
      avgSessionDuration: number;
      totalViews: number;
    };
  } | null = null;
  let highestScore = -1;

  Object.entries(results.variantResults).forEach(([variantId, data]) => {
    const positiveRate =
      data.views > 0 ? data.positive / data.views : 0;
    const negativeRate =
      data.views > 0 ? data.negative / data.views : 0;

    // Scoring formula: 
    // (positive rate * 50) - (negative rate * 30) + (normalized session duration * 20)
    const normalizedDuration = Math.min(data.avgSessionDuration / 300, 1); // Normalize to 5 min
    const score =
      positiveRate * 50 -
      negativeRate * 30 +
      normalizedDuration * 20;

    if (score > highestScore) {
      highestScore = score;
      winner = {
        variantId,
        score,
        metrics: {
          positiveRate,
          avgSessionDuration: data.avgSessionDuration,
          totalViews: data.views,
        },
      };
    }
  });

  return winner;
}

/**
 * List all A/B tests
 */
export async function listABTests(): Promise<ABTest[]> {
  const docs = await listDocs({
    collection: AB_TEST_COLLECTION,
    filter: {},
  });

  return docs.items.map((doc) => deserializeBigInt(doc.data) as ABTest);
}

/**
 * Assign user to a random variant (for testing)
 */
export function assignVariant(test: ABTest): ColorVariant {
  const randomIndex = Math.floor(Math.random() * test.variants.length);
  return test.variants[randomIndex];
}

/**
 * Serialize BigInt for Juno storage
 */
function serializeBigInt(obj: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(
    JSON.stringify(obj, (key, value) =>
      typeof value === "bigint" ? value.toString() : value,
    ),
  );
}

/**
 * Deserialize BigInt from Juno storage
 */
function deserializeBigInt(obj: Record<string, unknown>): Record<string, unknown> {
  if (obj.createdAt) obj.createdAt = BigInt(obj.createdAt);
  if (obj.updatedAt) obj.updatedAt = BigInt(obj.updatedAt);
  if (obj.timestamp) obj.timestamp = BigInt(obj.timestamp);
  return obj;
}
