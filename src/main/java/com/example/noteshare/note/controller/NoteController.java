package com.example.noteshare.note.controller;

import com.example.noteshare.note.entity.Note;
import com.example.noteshare.note.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService service;

    public NoteController(NoteService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Note> add(
            @Valid @RequestBody Note data) {

        return ResponseEntity.ok(service.add(data));
    }

    @GetMapping
    public ResponseEntity<List<Note>> getAll() {

        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Note> getById(
            @PathVariable Long id) {

        Note note = service.getById(id);

        if (note == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(note);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Note> update(
            @PathVariable Long id,
            @Valid @RequestBody Note data) {

        Note updatedNote = service.update(id, data);

        if (updatedNote == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updatedNote);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        Note note = service.getById(id);

        if (note == null) {
            return ResponseEntity.notFound().build();
        }

        service.delete(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<Note>> search(
            @RequestParam String keyword) {

        return ResponseEntity.ok(service.search(keyword));
    }
}