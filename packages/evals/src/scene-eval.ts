import type { SceneDSL } from '@openmaic/scene-schema';
import type { EvalDimension, EvalResult, Evaluator } from './types';
import { nanoid } from 'nanoid';

/** Checks that every quiz question has an answer */
export class QuizCorrectnessEvaluator implements Evaluator<SceneDSL> {
  readonly dimension: EvalDimension = 'quiz-correctness';

  async evaluate(scene: SceneDSL): Promise<EvalResult> {
    if (scene.type !== 'quiz') {
      return {
        evalId: nanoid(),
        sceneId: scene.id,
        score: 1,
        passed: true,
        details: { skipped: true, reason: 'not a quiz scene' },
        evaluatedAt: new Date().toISOString(),
      };
    }

    const questions = (scene.renderPayload as { questions?: Array<{ answer?: string[] }> })?.questions ?? [];
    const total = questions.length;
    const withAnswers = questions.filter((q) => q.answer && q.answer.length > 0).length;
    const score = total > 0 ? withAnswers / total : 1;

    return {
      evalId: nanoid(),
      sceneId: scene.id,
      score,
      passed: score >= 0.8,
      details: { total, withAnswers },
      evaluatedAt: new Date().toISOString(),
    };
  }
}

/** Checks that a scene has at least one speech action */
export class NarrationQualityEvaluator implements Evaluator<SceneDSL> {
  readonly dimension: EvalDimension = 'narration-quality';

  async evaluate(scene: SceneDSL): Promise<EvalResult> {
    const speechActions = scene.agentScript.filter((a) => a.type === 'speech');
    const score = speechActions.length > 0 ? 1 : 0;

    return {
      evalId: nanoid(),
      sceneId: scene.id,
      score,
      passed: score === 1,
      details: { speechActionCount: speechActions.length },
      evaluatedAt: new Date().toISOString(),
    };
  }
}

/** Checks that a scene has citations when it should */
export class FactualGroundingEvaluator implements Evaluator<SceneDSL> {
  readonly dimension: EvalDimension = 'factual-grounding';

  async evaluate(scene: SceneDSL): Promise<EvalResult> {
    const citationCount = scene.citations?.reduce((sum, c) => sum + c.chunks.length, 0) ?? 0;
    const requiresCitation = scene.validationRules?.requiresCitation ?? false;
    const passed = !requiresCitation || citationCount > 0;
    const score = passed ? 1 : 0;

    return {
      evalId: nanoid(),
      sceneId: scene.id,
      score,
      passed,
      details: { citationCount, requiresCitation },
      evaluatedAt: new Date().toISOString(),
    };
  }
}
