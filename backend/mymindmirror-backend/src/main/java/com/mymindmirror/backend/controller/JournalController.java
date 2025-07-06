package com.mymindmirror.backend.controller;

import com.mymindmirror.backend.model.JournalEntry;
import com.mymindmirror.backend.model.User;
import com.mymindmirror.backend.payload.JournalEntryRequest;
import com.mymindmirror.backend.payload.JournalEntryResponse;
import com.mymindmirror.backend.payload.MoodDataResponse;
import com.mymindmirror.backend.service.JournalService;
import com.mymindmirror.backend.service.UserService; // To get the current authenticated user
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * REST Controller for managing journal entries.
 * Handles API requests related to creating, retrieving, and viewing journal data.
 */
@RestController
@RequestMapping("/api/journal") // Base path for journal entry endpoints
public class JournalController {

    private static final Logger logger = LoggerFactory.getLogger(JournalController.class);

    private final JournalService journalService;
    private final UserService userService; // Injected to retrieve the current authenticated user

    // Constructor injection
    public JournalController(JournalService journalService, UserService userService) {
        this.journalService = journalService;
        this.userService = userService;
    }

    /**
     * Helper method to get the currently authenticated user from Spring Security context.
     * @return The User entity of the authenticated user.
     * @throws RuntimeException if the user cannot be found (should not happen for authenticated users).
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName(); // Get username from SecurityContext
        logger.debug("Attempting to retrieve current user: {}", username);
        return userService.findByUsername(username)
                .orElseThrow(() -> {
                    logger.error("Authenticated user '{}' not found in database. This indicates a security misconfiguration.", username);
                    return new RuntimeException("Authenticated user not found.");
                });
    }

    /**
     * Creates a new journal entry or updates today's entry for the authenticated user.
     * @param request JournalEntryRequest containing the raw text.
     * @return ResponseEntity with the created/updated JournalEntryResponse.
     */
    @PostMapping
    public ResponseEntity<JournalEntryResponse> createJournalEntry(@RequestBody JournalEntryRequest request) {
        logger.info("Received request to create/update journal entry.");
        try {
            User currentUser = getCurrentUser(); // Get the authenticated user
            JournalEntry savedEntry = journalService.saveJournalEntry(currentUser, request.getText());
            logger.info("Journal entry saved/updated successfully for user {}.", currentUser.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(new JournalEntryResponse(savedEntry));
        } catch (Exception e) {
            logger.error("Error saving journal entry: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Retrieves a list of journal entries for the authenticated user within a specified date range.
     * @param startDate Optional start date (YYYY-MM-DD). Defaults to 30 days ago.
     * @param endDate Optional end date (YYYY-MM-DD). Defaults to today.
     * @return ResponseEntity with a list of JournalEntryResponse objects.
     */
    @GetMapping("/history")
    public ResponseEntity<List<JournalEntryResponse>> getJournalHistory(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        logger.info("Received request for journal history.");
        User currentUser = getCurrentUser();
        LocalDate start = LocalDate.now().minusDays(30); // Default to last 30 days
        LocalDate end = LocalDate.now(); // Default to today

        try {
            if (startDate != null) {
                start = LocalDate.parse(startDate);
            }
            if (endDate != null) {
                end = LocalDate.parse(endDate);
            }
        } catch (DateTimeParseException e) {
            logger.error("Invalid date format provided: {}. Using default date range.", e.getMessage());
            return ResponseEntity.badRequest().body(null); // Or return empty list, depending on desired behavior
        }

        List<JournalEntry> entries = journalService.getJournalEntriesForUser(currentUser, start, end);
        logger.info("Found {} journal entries for user {} in range {} to {}.", entries.size(), currentUser.getUsername(), start, end);
        // Convert entities to DTOs before sending to frontend
        List<JournalEntryResponse> responses = entries.stream()
                .map(JournalEntryResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(responses);
    }

    /**
     * Retrieves mood data points for charting for the authenticated user within a specified date range.
     * @param startDate Optional start date (YYYY-MM-DD). Defaults to 30 days ago.
     * @param endDate Optional end date (YYYY-MM-DD). Defaults to today.
     * @return ResponseEntity with a list of MoodDataResponse objects.
     */
    @GetMapping("/mood-data")
    public ResponseEntity<List<MoodDataResponse>> getMoodData(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        logger.info("Received request for mood data for chart.");
        User currentUser = getCurrentUser();
        LocalDate start = LocalDate.now().minusDays(30);
        LocalDate end = LocalDate.now();

        try {
            if (startDate != null) {
                start = LocalDate.parse(startDate);
            }
            if (endDate != null) {
                end = LocalDate.parse(endDate);
            }
        } catch (DateTimeParseException e) {
            logger.error("Invalid date format provided: {}. Using default date range.", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        }

        List<MoodDataResponse> moodData = journalService.getMoodDataForChart(currentUser, start, end);
        logger.info("Found {} mood data points for user {} in range {} to {}.", moodData.size(), currentUser.getUsername(), start, end);
        return ResponseEntity.ok(moodData);
    }

    /**
     * Retrieves a single journal entry by its ID for the authenticated user.
     * @param id The UUID of the journal entry.
     * @return ResponseEntity with the JournalEntryResponse.
     */
    @GetMapping("/{id}")
    public ResponseEntity<JournalEntryResponse> getJournalEntry(@PathVariable UUID id) {
        logger.info("Received request for journal entry with ID: {}.", id);
        User currentUser = getCurrentUser();
        return journalService.getJournalEntryById(id)
                .filter(entry -> entry.getUser().getId().equals(currentUser.getId())) // Ensure user owns the entry
                .map(JournalEntryResponse::new) // Convert to DTO
                .map(ResponseEntity::ok)
                .orElseGet(() -> {
                    logger.warn("Journal entry with ID {} not found or not owned by user {}.", id, currentUser.getUsername());
                    return ResponseEntity.notFound().build();
                });
    }
}
