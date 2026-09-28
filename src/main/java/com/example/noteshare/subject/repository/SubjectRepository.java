package com.example.noteshare.subject.repository;

import com.example.noteshare.subject.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectRepository extends JpaRepository<Subject, Long> {

    List<Subject> findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(
            String name,
            String code
    );
}