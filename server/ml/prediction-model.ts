import { FeatureEngineer, UserProfile } from "./feature-engineering";

export interface PredictionResult {
    probability: number;      // 0-100
    applySignal: "GOOD" | "SOON" | "WAIT";
    reasoning: string;
    factors: Record<string, string>; // e.g. "Freshness": "+40"
}

export class PredictionModel {

    // Weights (Simulating a trained Logistic Regression model)
    // Derived from industry knowledge of what matters most
    private static WEIGHTS = {
        days_since_posted: 3.5,      // Freshness is HUGE
        skill_overlap_score: 4.0,    // Skills are critical
        experience_match: 2.0,       // Level match is important but loose
        role_competition_score: 2.5, // Competition matters
        bias: -4.5                   // Bias to shift sigmoid center
    };

    static predict(job: any, user: UserProfile): PredictionResult {
        const features = FeatureEngineer.extract(job, user);

        // 1. Calculate Logits (Linear Combination)
        const logit =
            (features.days_since_posted * this.WEIGHTS.days_since_posted) +
            (features.skill_overlap_score * this.WEIGHTS.skill_overlap_score) +
            (features.experience_match * this.WEIGHTS.experience_match) +
            (features.role_competition_score * this.WEIGHTS.role_competition_score) +
            this.WEIGHTS.bias;

        // 2. Sigmoid Activation to get 0-1 probability
        const probabilityRaw = 1 / (1 + Math.exp(-logit));
        const probability = Math.round(probabilityRaw * 100);

        // 3. Generate Signal
        let applySignal: "GOOD" | "SOON" | "WAIT" = "WAIT";
        if (probability >= 70) applySignal = "GOOD";
        else if (probability >= 45) applySignal = "SOON";

        // 4. Generate Explainability (Reasoning & Factors)
        const { reasoning, factors } = this.explain(features, probability);

        return {
            probability,
            applySignal,
            reasoning,
            factors
        };
    }

    private static explain(features: any, probability: number) {
        let factors: Record<string, string> = {};
        let reasons: string[] = [];

        // Explain Freshness
        if (features.days_since_posted > 0.8) {
            factors["Freshness"] = "+High";
            reasons.push("Job is very new.");
        } else if (features.days_since_posted < 0.3) {
            factors["Freshness"] = "-Low";
            reasons.push("Job post is aging.");
        }

        // Explain Skills
        if (features.skill_overlap_score > 0.7) {
            factors["Skills"] = "+Strong";
            reasons.push("Strong skill match.");
        } else if (features.skill_overlap_score < 0.3) {
            factors["Skills"] = "-Weak";
            reasons.push("Missing key skills.");
        }

        // Explain Competition
        if (features.role_competition_score > 0.8) {
            factors["Competition"] = "+Low";
            reasons.push("Early applicant advantage.");
        } else if (features.role_competition_score < 0.3) {
            factors["Competition"] = "-High";
            reasons.push("Many applicants already.");
        }

        // Final Reasoning String
        let reasoning = reasons.join(" ");
        if (!reasoning) reasoning = "Based on standard hiring criteria.";

        return { reasoning, factors };
    }
}
