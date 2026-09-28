package com.example.noteshare.rating.repository;

import com.example.noteshare.rating.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RatingRepository extends JpaRepository<Rating, Long> {

    List<Rating> findByCommentContainingIgnoreCase(String comment);
}