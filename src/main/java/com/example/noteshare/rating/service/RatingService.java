package com.example.noteshare.rating.service;

import com.example.noteshare.rating.entity.Rating;
import com.example.noteshare.rating.repository.RatingRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RatingService {

    private final RatingRepository repository;

    public RatingService(RatingRepository repository) {
        this.repository = repository;
    }

    public Rating add(Rating data) {
        return repository.save(data);
    }

    public List<Rating> getAll() {
        return repository.findAll();
    }

    public Rating getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Rating update(Long id, Rating data) {

        Rating existingRating = repository.findById(id).orElse(null);

        if (existingRating == null) {
            return null;
        }

        existingRating.setRating(data.getRating());
        existingRating.setComment(data.getComment());
        existingRating.setStudentId(data.getStudentId());
        existingRating.setNoteId(data.getNoteId());

        return repository.save(existingRating);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<Rating> search(String keyword) {
        return repository.findByCommentContainingIgnoreCase(keyword);
    }
}