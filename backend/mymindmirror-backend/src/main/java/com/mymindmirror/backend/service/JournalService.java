package com.mymindmirror.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper; // For JSON parsing/serialization
import com.mymindmirror.backend.model.JournalEntry;
import com.mymindmirror.backend.model.User;
import com.mymindmirror.backend.repository.JournalEntryRepository;
import com.mymindmirror.backend.payload.MoodDataResponse; // For chart data
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service class for managing JournalEntry-related business logic.
 * Handles saving, retrieving, and orchestrating AI analysis for journal entries.
 */
@Service
public class JournalService {

    private static final Logger logger = LoggerFactory.getLogger(JournalService.class);

    private final JournalEntryRepository journalEntryRepository;
    private final WebClient webClient; // For making HTTP calls to Flask ML service
    private final ObjectMapper objectMapper; // For converting Java objects to/from JSON strings

    @Value("${app.ml-service.url}") // Injects the Flask ML service URL from application.properties
    private String mlServiceBaseUrl;

    // Constructor injection for dependencies
    public JournalService(JournalEntryRepository journalEntryRepository, WebClient.Builder webClientBuilder, ObjectMapper objectMapper) {
        this.journalEntryRepository = journalEntryRepository;
        // Build WebClient instance with the base URL for the ML service
        this.webClient = webClientBuilder.baseUrl("http://localhost:5000").build(); // Default, will be overridden by @Value
        this.objectMapper = objectMapper;
    }

    /**
     * Saves a new journal entry or updates an existing one for the current day.
     * Orchestrates the call to the Flask ML service for AI analysis.
     * @param user The authenticated user creating/updating the entry.
     * @param rawText The raw journal text provided by the user.
     * @return The saved JournalEntry entity with AI analysis results.
     */
    public JournalEntry saveJournalEntry(User user, String rawText) {
        logger.info("Attempting to save journal entry for user: {} on date: {}", user.getUsername(), LocalDate.now());

        // Check if an entry for today already exists for this user
        Optional<JournalEntry> existingEntry = journalEntryRepository.findByUserAndEntryDate(user, LocalDate.now());
        JournalEntry entryToSave = existingEntry.orElseGet(JournalEntry::new); // Create new if not exists, else get existing

        entryToSave.setUser(user);
        entryToSave.setEntryDate(LocalDate.now());
        entryToSave.setRawText(rawText);

        // --- Call Flask ML Service for AI Analysis ---
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("text", rawText); // Send the raw journal text to Flask

        Map<String, Object> mlResponse = null;
        try {
            logger.info("Calling ML service at {}/analyze_journal", mlServiceBaseUrl);
            // Make a POST request to the Flask ML service
            mlResponse = webClient.post()
                    .uri("/analyze_journal")
                    .bodyValue(requestBody) // Set the JSON request body
                    .retrieve() // Retrieve the response
                    .bodyToMono(Map.class) // Expect a JSON object as a Map
                    .block(); // Block to get the result synchronously (for simplicity in 6-7 days)
            // In a real production app, consider using .subscribe() or async handling.
            logger.info("ML service responded successfully.");
        } catch (Exception e) {
            logger.error("Failed to call ML service or received error: {}", e.getMessage(), e);
            // Handle ML service errors gracefully: e.g., set default values or return error
            // For MVP, we'll log and proceed with null/default AI data if ML service fails.
        }

        // --- Process ML Service Response and Update JournalEntry ---
        if (mlResponse != null) {
            try {
                // Safely cast and convert types from ML service response
                entryToSave.setMoodScore(((Number) mlResponse.get("moodScore")).doubleValue());

                // Convert Map/List objects from ML service response to JSON strings for database storage
                // This is crucial because JPA's @Column(columnDefinition = "TEXT") stores strings.
                entryToSave.setEmotions(objectMapper.writeValueAsString(mlResponse.get("emotions")));
                entryToSave.setCoreConcerns(objectMapper.writeValueAsString(mlResponse.get("coreConcerns")));
                entryToSave.setSummary((String) mlResponse.get("summary"));
                entryToSave.setGrowthTips(objectMapper.writeValueAsString(mlResponse.get("growthTips")));
                logger.info("Journal entry AI analysis results processed.");
            } catch (JsonProcessingException e) {
                logger.error("Error serializing ML response to JSON string for DB storage: {}", e.getMessage(), e);
                // Reset AI fields to null if serialization fails
                entryToSave.setEmotions(null);
                entryToSave.setCoreConcerns(null);
                entryToSave.setSummary(null);
                entryToSave.setGrowthTips(null);
            } catch (ClassCastException e) {
                logger.error("Type casting error from ML response: {}", e.getMessage(), e);
                // Reset AI fields to null if casting fails
                entryToSave.setEmotions(null);
                entryToSave.setCoreConcerns(null);
                entryToSave.setSummary(null);
                entryToSave.setGrowthTips(null);
            }
        } else {
            logger.warn("ML service response was null. Journal entry saved without AI analysis.");
            // Ensure AI fields are explicitly null if ML service failed
            entryToSave.setMoodScore(null);
            entryToSave.setEmotions(null);
            entryToSave.setCoreConcerns(null);
            entryToSave.setSummary(null);
            entryToSave.setGrowthTips(null);
        }

        JournalEntry savedEntry = journalEntryRepository.save(entryToSave);
        logger.info("Journal entry with ID {} for user {} saved successfully.", savedEntry.getId(), user.getUsername());
        return savedEntry;
    }

    /**
     * Retrieves journal entries for a specific user within a given date range.
     * @param user The authenticated user.
     * @param startDate The start date of the range.
     * @param endDate The end date of the range.
     * @return A list of JournalEntry entities.
     */
    public List<JournalEntry> getJournalEntriesForUser(User user, LocalDate startDate, LocalDate endDate) {
        logger.info("Fetching journal entries for user: {} from {} to {}", user.getUsername(), startDate, endDate);
        return journalEntryRepository.findByUserAndEntryDateBetween(user, startDate, endDate);
    }

    /**
     * Retrieves a single journal entry by its ID.
     * @param entryId The ID of the journal entry.
     * @return An Optional containing the JournalEntry if found.
     */
    public Optional<JournalEntry> getJournalEntryById(UUID entryId) {
        logger.info("Fetching journal entry by ID: {}", entryId);
        return journalEntryRepository.findById(entryId);
    }

    /**
     * Retrieves mood data points for charting for a specific user within a date range.
     * @param user The authenticated user.
     * @param startDate The start date of the range.
     * @param endDate The end date of the range.
     * @return A list of MoodDataResponse objects.
     */
    public List<MoodDataResponse> getMoodDataForChart(User user, LocalDate startDate, LocalDate endDate) {
        logger.info("Fetching mood data for chart for user: {} from {} to {}", user.getUsername(), startDate, endDate);
        List<JournalEntry> entries = journalEntryRepository.findByUserAndEntryDateBetween(user, startDate, endDate);
        // Filter out entries without a mood score and map to DTO
        return entries.stream()
                .filter(entry -> entry.getMoodScore() != null)
                .map(entry -> new MoodDataResponse(entry.getEntryDate(), entry.getMoodScore()))
                .sorted((d1, d2) -> d1.getDate().compareTo(d2.getDate())) // Sort by date for chart
                .collect(Collectors.toList());
    }
}
