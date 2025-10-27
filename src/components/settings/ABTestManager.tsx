"use client";

/**
 * A/B TEST MANAGER
 *
 * Interface for creating and managing brand color A/B tests.
 */

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import {
  Play,
  StopCircle,
  Plus,
  TrendingUp,
  Users,
  Clock,
  Trophy,
  X,
} from "lucide-react";
import {
  createABTest,
  startABTest,
  endABTest,
  listABTests,
  getTestResults,
  getWinningVariant,
  type ABTest,
  type ColorVariant,
} from "@/utils/brandingABTest";
import { COLOR_PRESETS } from "@/utils/colorPresets";

export function ABTestManager() {
  const { appUser } = useAuth();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  useEffect(() => {
    loadTests();
  }, []);

  const loadTests = async () => {
    try {
      setLoading(true);
      const allTests = await listABTests();
      setTests(allTests);
    } catch (error) {
      console.error("Error loading tests:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Brand Color A/B Testing</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Test different color schemes before committing
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Test
        </Button>
      </div>

      {/* Create Test Form */}
      {showCreateForm && (
        <CreateTestForm
          onClose={() => setShowCreateForm(false)}
          onCreated={() => {
            setShowCreateForm(false);
            loadTests();
          }}
          userId={appUser?.id || ""}
        />
      )}

      {/* Test List */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Loading tests...</p>
        </div>
      ) : tests.length === 0 ? (
        <Card className="p-8 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">
            No A/B tests yet. Create one to start testing!
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <TestCard
              key={test.id}
              test={test}
              onUpdate={loadTests}
              expanded={selectedTest === test.id}
              onToggle={() =>
                setSelectedTest(selectedTest === test.id ? null : test.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Create Test Form Component
 */
function CreateTestForm({
  onClose,
  onCreated,
  userId,
}: {
  onClose: () => void;
  onCreated: () => void;
  userId: string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [variants, setVariants] = useState<Omit<ColorVariant, "id">[]>([
    {
      name: "Variant A",
      primaryColor: "#4F46E5",
      secondaryColor: "#7C3AED",
      accentColor: "#EC4899",
    },
    {
      name: "Variant B",
      primaryColor: "#059669",
      secondaryColor: "#0891B2",
      accentColor: "#F59E0B",
    },
  ]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name) {
      alert("Please enter a test name");
      return;
    }

    try {
      setCreating(true);
      await createABTest(name, description, variants, userId);
      onCreated();
    } catch (error) {
      console.error("Error creating test:", error);
      alert("Failed to create test");
    } finally {
      setCreating(false);
    }
  };

  const addVariant = () => {
    const randomPreset = COLOR_PRESETS[Math.floor(Math.random() * COLOR_PRESETS.length)];
    setVariants([
      ...variants,
      {
        name: `Variant ${String.fromCharCode(65 + variants.length)}`,
        primaryColor: randomPreset.primaryColor,
        secondaryColor: randomPreset.secondaryColor,
        accentColor: randomPreset.accentColor,
      },
    ]);
  };

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Create A/B Test</h3>
        <Button variant="outline" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Test Name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Spring 2025 Color Test"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Description (Optional)
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you testing?"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">Variants</label>
            <Button variant="outline" size="sm" onClick={addVariant}>
              <Plus className="h-4 w-4 mr-1" />
              Add Variant
            </Button>
          </div>

          <div className="space-y-3">
            {variants.map((variant, idx) => (
              <div key={idx} className="rounded-lg border p-4">
                <Input
                  value={variant.name}
                  onChange={(e) => {
                    const newVariants = [...variants];
                    newVariants[idx].name = e.target.value;
                    setVariants(newVariants);
                  }}
                  className="mb-2"
                  placeholder="Variant name"
                />
                <div className="flex gap-2">
                  {(["primaryColor", "secondaryColor", "accentColor"] as const).map(
                    (colorKey) => (
                      <div key={colorKey} className="flex-1">
                        <input
                          type="color"
                          value={variant[colorKey]}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[idx][colorKey] = e.target.value;
                            setVariants(newVariants);
                          }}
                          className="h-10 w-full cursor-pointer rounded"
                        />
                      </div>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating..." : "Create Test"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Test Card Component
 */
function TestCard({
  test,
  onUpdate,
  expanded,
  onToggle,
}: {
  test: ABTest;
  onUpdate: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const [results, setResults] = useState<Awaited<ReturnType<typeof getTestResults>> | null>(null);
  const [winner, setWinner] = useState<Awaited<ReturnType<typeof getWinningVariant>> | null>(null);

  useEffect(() => {
    if (expanded && test.status !== "draft") {
      loadResults();
    }
  }, [expanded, test.id]);

  const loadResults = async () => {
    try {
      const testResults = await getTestResults(test.id);
      const winningVariant = await getWinningVariant(test.id);
      setResults(testResults);
      setWinner(winningVariant);
    } catch (error) {
      console.error("Error loading results:", error);
    }
  };

  const handleStart = async () => {
    try {
      await startABTest(test.id);
      onUpdate();
    } catch (error) {
      console.error("Error starting test:", error);
      alert("Failed to start test");
    }
  };

  const handleEnd = async () => {
    try {
      await endABTest(test.id);
      onUpdate();
    } catch (error) {
      console.error("Error ending test:", error);
      alert("Failed to end test");
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1" onClick={onToggle} role="button">
          <h3 className="text-lg font-semibold">{test.name}</h3>
          {test.description && (
            <p className="text-sm text-gray-600">{test.description}</p>
          )}
          <div className="mt-2 flex gap-2">
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                test.status === "active"
                  ? "bg-green-100 text-green-800"
                  : test.status === "completed"
                    ? "bg-gray-100 text-gray-800"
                    : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {test.status}
            </span>
            <span className="text-xs text-gray-500">
              {test.variants.length} variants
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {test.status === "draft" && (
            <Button size="sm" onClick={handleStart}>
              <Play className="h-4 w-4 mr-1" />
              Start
            </Button>
          )}
          {test.status === "active" && (
            <Button size="sm" variant="outline" onClick={handleEnd}>
              <StopCircle className="h-4 w-4 mr-1" />
              End
            </Button>
          )}
        </div>
      </div>

      {/* Expanded Results */}
      {expanded && results && (
        <div className="mt-6 space-y-4 border-t pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <Users className="h-5 w-5 text-blue-600 mb-1" />
              <p className="text-2xl font-bold">{results.totalResponses}</p>
              <p className="text-xs text-gray-600">Total Responses</p>
            </div>

            {winner && (
              <div className="rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20 col-span-2">
                <Trophy className="h-5 w-5 text-yellow-600 mb-1" />
                <p className="text-sm font-semibold">
                  Winning Variant: {test.variants.find(v => v.id === winner.variantId)?.name}
                </p>
                <p className="text-xs text-gray-600">
                  Score: {winner.score.toFixed(1)} | {(winner.metrics.positiveRate * 100).toFixed(0)}% positive
                </p>
              </div>
            )}
          </div>

          {/* Variant Results */}
          <div className="space-y-2">
            {test.variants.map((variant) => {
              const variantData = results.variantResults[variant.id];
              if (!variantData) return null;

              const positiveRate = variantData.views > 0 
                ? (variantData.positive / variantData.views) * 100 
                : 0;

              return (
                <div key={variant.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="h-6 w-6 rounded" style={{ backgroundColor: variant.primaryColor }} />
                        <div className="h-6 w-6 rounded" style={{ backgroundColor: variant.secondaryColor }} />
                        <div className="h-6 w-6 rounded" style={{ backgroundColor: variant.accentColor }} />
                      </div>
                      <span className="font-medium">{variant.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{variantData.views} views</p>
                      <p className="text-xs text-green-600">
                        {positiveRate.toFixed(0)}% positive
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
