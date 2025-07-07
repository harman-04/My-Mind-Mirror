// src/main/java/com/mymindmirror/backend/service/JournalService.java
package com.mymindmirror.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mymindmirror.backend.model.JournalEntry;
import com.mymindmirror.backend.model.User;
import com.mymindmirror.backend.repository.JournalEntryRepository;
import com.mymindmirror.backend.payload.MoodDataResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value; // Keep this if you want to log the URL, otherwise it can be removed
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient; // Keep this
import reactor.core.publisher.Mono; // Keep this if used elsewhere in the class

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service class for managing JournalEntry-related business logic.
 * Handles saving, retrieving, updating, deleting, and orchestrating AI analysis for journal entries.
 */
@Service
public class JournalService {

    private static final Logger logger = LoggerFactory.getLogger(JournalService.class);

    private final JournalEntryRepository journalEntryRepository;
    private final WebClient webClient; // This will now be the pre-configured WebClient bean
    private final ObjectMapper objectMapper;

    // Keep this @Value field if you want to log the mlServiceBaseUrl string.
    // It's no longer used for WebClient construction in this class, but useful for logging.
    @Value("${app.ml-service.url}")
    private String mlServiceBaseUrl;

    // Constructor injection: Spring will now inject the 'mlServiceWebClient' bean
    public JournalService(JournalEntryRepository journalEntryRepository, WebClient mlServiceWebClient, ObjectMapper objectMapper) {
        this.journalEntryRepository = journalEntryRepository;
        this.webClient = mlServiceWebClient; // Inject the WebClient bean here
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

        Optional<JournalEntry> existingEntry = journalEntryRepository.findByUserAndEntryDate(user, LocalDate.now());
        JournalEntry entryToSave = existingEntry.orElseGet(JournalEntry::new);

        entryToSave.setUser(user);
        entryToSave.setEntryDate(LocalDate.now());
        entryToSave.setRawText(rawText);

        processAiAnalysis(rawText, entryToSave);

        JournalEntry savedEntry = journalEntryRepository.save(entryToSave);
        logger.info("Journal entry with ID {} for user {} saved successfully.", savedEntry.getId(), user.getUsername());
        return savedEntry;
    }

    /**
     * Updates an existing journal entry.
     * Re-runs AI analysis on the updated text.
     * @param entryId The ID of the entry to update.
     * @param user The authenticated user (for ownership check).
     * @param updatedText The new raw text for the entry.
     * @return The updated JournalEntry entity.
     * @throws IllegalArgumentException if entry not found or not owned by user.
     */
    public JournalEntry updateJournalEntry(UUID entryId, User user, String updatedText) {
        logger.info("Attempting to update journal entry with ID: {} for user: {}", entryId, user.getUsername());
        JournalEntry existingEntry = journalEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Journal entry not found with ID: " + entryId));

        if (!existingEntry.getUser().getId().equals(user.getId())) {
            logger.warn("User {} attempted to update entry {} not owned by them.", user.getUsername(), entryId);
            throw new IllegalArgumentException("You are not authorized to update this journal entry.");
        }

        existingEntry.setRawText(updatedText);

        processAiAnalysis(updatedText, existingEntry);

        JournalEntry savedEntry = journalEntryRepository.save(existingEntry);
        logger.info("Journal entry with ID {} for user {} updated successfully.", savedEntry.getId(), user.getUsername());
        return savedEntry;
    }

    /**
     * Deletes a journal entry.
     * @param entryId The ID of the entry to delete.
     * @param user The authenticated user (for ownership check).
     * @throws IllegalArgumentException if entry not found or not owned by user.
     */
    public void deleteJournalEntry(UUID entryId, User user) {
        logger.info("Attempting to delete journal entry with ID: {} for user: {}", entryId, user.getUsername());
        JournalEntry existingEntry = journalEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Journal entry not found with ID: " + entryId));

        if (!existingEntry.getUser().getId().equals(user.getId())) {
            logger.warn("User {} attempted to delete entry {} not owned by them.", user.getUsername(), entryId);
            throw new IllegalArgumentException("You are not authorized to delete this journal entry.");
        }

        journalEntryRepository.delete(existingEntry);
        logger.info("Journal entry with ID {} for user {} deleted successfully.", entryId, user.getUsername());
    }

    /**
     * Helper method to call ML service and update JournalEntry fields.
     */
    private void processAiAnalysis(String textForAnalysis, JournalEntry entryToUpdate) {
        Map<String, String> requestBody = new HashMap<>();
        requestBody.put("text", textForAnalysis);

        Map<String, Object> mlResponse = null;
        try {
            // This mlServiceBaseUrl field is now correctly injected by Spring
            logger.info("Calling ML service at {}/analyze_journal", mlServiceBaseUrl);
            mlResponse = webClient.post()
                    .uri("/analyze_journal") // Use relative URI as base URL is already set in the bean
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            logger.info("ML service responded successfully.");
        } catch (Exception e) {
            logger.error("Failed to call ML service or received error: {}", e.getMessage(), e);
        }

        if (mlResponse != null) {
            try {
                entryToUpdate.setMoodScore(((Number) mlResponse.get("moodScore")).doubleValue());
                entryToUpdate.setEmotions(objectMapper.writeValueAsString(mlResponse.get("emotions")));
                entryToUpdate.setCoreConcerns(objectMapper.writeValueAsString(mlResponse.get("coreConcerns")));
                entryToUpdate.setSummary((String) mlResponse.get("summary"));
                entryToUpdate.setGrowthTips(objectMapper.writeValueAsString(mlResponse.get("growthTips")));
                logger.info("Journal entry AI analysis results processed.");
            } catch (JsonProcessingException e) {
                logger.error("Error serializing ML response to JSON string for DB storage: {}", e.getMessage(), e);
                resetAiFields(entryToUpdate);
            } catch (ClassCastException e) {
                logger.error("Type casting error from ML response: {}", e.getMessage(), e);
                resetAiFields(entryToUpdate);
            }
        } else {
            logger.warn("ML service response was null. Journal entry saved/updated without AI analysis.");
            resetAiFields(entryToUpdate);
        }
    }

    /**
     * Helper method to reset AI fields if analysis fails.
     */
    private void resetAiFields(JournalEntry entry) {
        entry.setMoodScore(null);
        entry.setEmotions(null);
        entry.setCoreConcerns(null);
        entry.setSummary(null);
        entry.setGrowthTips(null);
    }


    public List<JournalEntry> getJournalEntriesForUser(User user, LocalDate startDate, LocalDate endDate) {
        logger.info("Fetching journal entries for user: {} from {} to {}", user.getUsername(), startDate, endDate);
        return journalEntryRepository.findByUserAndEntryDateBetween(user, startDate, endDate);
    }

    public Optional<JournalEntry> getJournalEntryById(UUID entryId) {
        logger.info("Fetching journal entry by ID: {}", entryId);
        return journalEntryRepository.findById(entryId);
    }

    public List<MoodDataResponse> getMoodDataForChart(User user, LocalDate startDate, LocalDate endDate) {
        logger.info("Fetching mood data for chart for user: {} from {} to {}", user.getUsername(), startDate, endDate);
        List<JournalEntry> entries = journalEntryRepository.findByUserAndEntryDateBetween(user, startDate, endDate);
        return entries.stream()
                .filter(entry -> entry.getMoodScore() != null)
                .map(entry -> new MoodDataResponse(entry.getEntryDate(), entry.getMoodScore()))
                .sorted((d1, d2) -> d1.getDate().compareTo(d2.getDate()))
                .collect(Collectors.toList());
    }
}