package com.example.noteshare.rating.controller;

import com.example.noteshare.rating.entity.Rating;
import com.example.noteshare.rating.service.RatingService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ratings")
public class RatingController {

    private final RatingService service;

    public RatingController(RatingService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<Rating> add(
            @Valid @RequestBody Rating data) {

        return ResponseEntity.ok(service.add(data));
    }

    @GetMapping
    public ResponseEntity<List<Rating>> getAll() {

        return ResponseEntity.ok(service.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Rating> getById(
            @PathVariable Long id) {

        Rating rating = service.getById(id);

        if (rating == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(rating);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Rating> update(
            @PathVariable Long id,
            @Valid @RequestBody Rating data) {

        Rating updatedRating = service.update(id, data);

        if (updatedRating == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updatedRating);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id) {

        Rating rating = service.getById(id);

        if (rating == null) {
            return ResponseEntity.notFound().build();
        }

        service.delete(id);

        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<Rating>> search(
            @RequestParam String keyword) {

        return ResponseEntity.ok(service.search(keyword));
    }
}