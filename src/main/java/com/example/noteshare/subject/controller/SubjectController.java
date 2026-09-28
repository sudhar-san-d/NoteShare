package com.example.noteshare.subject.controller;

import com.example.noteshare.subject.entity.Subject;
import com.example.noteshare.subject.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService service;

    public SubjectController(SubjectService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Subject> add(
            @Valid @RequestBody Subject data) {

        return ResponseEntity.ok(service.add(data));
    }

    @GetMapping
    public ResponseEntity<List<Subject>> getAll() {

        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Subject> getById(
            @PathVariable Long id) {

        Subject subject = service.getById(id);

        if (subject == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(subject);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Subject> update(
            @PathVariable Long id,
            @Valid @RequestBody Subject data) {

        Subject updatedSubject = service.update(id, data);

        if (updatedSubject == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updatedSubject);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        Subject subject = service.getById(id);

        if (subject == null) {
            return ResponseEntity.notFound().build();
        }

        service.delete(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<Subject>> search(
            @RequestParam String keyword) {

        return ResponseEntity.ok(service.search(keyword));
    }
}