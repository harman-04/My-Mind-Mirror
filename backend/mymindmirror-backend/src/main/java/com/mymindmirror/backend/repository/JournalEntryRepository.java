package com.mymindmirror.backend.repository;

import com.mymindmirror.backend.model.JournalEntry;
import com.mymindmirror.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * JPA Repository for JournalEntry entities.
 * Provides standard CRUD operations and custom query methods for JournalEntry data.
 */
@Repository // Marks this interface as a Spring Data JPA repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, UUID> {

    /**
     * Finds all Journal Entries for a specific user within a given date range.
     * @param user The User entity.
     * @param startDate The start date of the range (inclusive).
     * @param endDate The end date of the range (inclusive).
     * @return A list of JournalEntry objects.
     */
    List<JournalEntry> findByUserAndEntryDateBetween(User user, LocalDate startDate, LocalDate endDate);

    /**
     * Finds a Journal Entry for a specific user on a specific date.
     * Useful for checking if an entry for today already exists.
     * @param user The User entity.
     * @param entryDate The specific date to search for.
     * @return An Optional containing the JournalEntry if found, or empty if not.
     */
    Optional<JournalEntry> findByUserAndEntryDate(User user, LocalDate entryDate);
}
