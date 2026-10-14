package com.surakshasetu.model;

public class SeverityClassifier {

    public static String classify(String category, String description) {
        String desc = description.toLowerCase();

        // Critical: life-threatening, weapons, minors involved
        String[] criticalKeywords = {
                "murder", "killed", "death", "weapon", "gun", "knife",
                "rape", "child abuse", "kidnap", "life threat", "acid attack"
        };
        for (String keyword : criticalKeywords) {
            if (desc.contains(keyword)) {
                return "Critical";
            }
        }

        // Major: financial loss, force, threats, hacking
        String[] majorKeywords = {
                "hacked", "fraud", "robbery", "assault", "threat",
                "blackmail", "burglary", "extortion", "unauthorized transaction"
        };
        for (String keyword : majorKeywords) {
            if (desc.contains(keyword)) {
                return "Major";
            }
        }

        // Fallback: baseline severity by category
        switch (category.toLowerCase()) {
            case "cybercrime":
                return "Major";
            case "murder": 
            	return "Critical";
            case "fraud": 
            	return "Major";
            case "assault":
                return "Major";
            case "missing person":
                return "Critical";
            case "theft":
                return "Minor";
            case "harassment":
                return "Minor";
            default:
                return "Minor";
        }
    }
}