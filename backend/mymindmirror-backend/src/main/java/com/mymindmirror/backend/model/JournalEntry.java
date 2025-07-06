package com.mymindmirror.backend.model;

import jakarta.persistence.*;
import lombok.Data; // Lombok annotation for getters, setters, equals, hashCode, toString
import java.time.LocalDate; // For storing dates without time
import java.util.UUID; // For universally unique identifiers

/**
 * Represents a single journal entry made by a user.
 * This entity maps to the 'journal_entries' table in the database.
 */
@Entity // Marks this class as a JPA entity
@Table(name = "journal_entries") // Specifies the table name in the database
@Data // Lombok annotation: automatically generates getters, setters, toString, equals, and hashCode methods
public class JournalEntry {

    @Id // Marks this field as the primary key
    @GeneratedValue(strategy = GenerationType.UUID) // Generates a UUID for the ID automatically
    private UUID id;

    // Many-to-one relationship with the User entity.
    // Each journal entry belongs to one user.
    @ManyToOne(fetch = FetchType.LAZY) // LAZY fetch type to load User only when explicitly accessed
    @JoinColumn(name = "user_id", nullable = false) // Specifies the foreign key column in 'journal_entries' table
    private User user; // The user who created this entry

    @Column(nullable = false) // Ensures the entry date is not null
    private LocalDate entryDate; // The date of the journal entry

    @Column(columnDefinition = "TEXT", nullable = false) // Stores the raw journal text, can be long
    private String rawText; // The original text written by the user

    @Column(nullable = true) // Mood score can be null if AI analysis fails or is pending
    private Double moodScore; // Numerical representation of mood (-1.0 to 1.0)

    @Column(columnDefinition = "TEXT", nullable = true) // Stores JSON string of emotions, can be long
    private String emotions; // JSON string: e.g., {"joy": 0.8, "sadness": 0.2}

    @Column(columnDefinition = "TEXT", nullable = true) // Stores JSON string of core concerns, can be long
    private String coreConcerns; // JSON string: e.g., ["work stress", "relationship issues"]

    @Column(columnDefinition = "TEXT", nullable = true) // Stores the AI-generated summary, can be long
    private String summary;

    @Column(columnDefinition = "TEXT", nullable = true) // Stores JSON string of growth tips, can be long
    private String growthTips; // JSON string: e.g., ["Practice mindfulness", "Break tasks down"]
}
