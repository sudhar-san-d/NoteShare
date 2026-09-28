package com.example.noteshare.subject.service;

import com.example.noteshare.subject.entity.Subject;
import com.example.noteshare.subject.repository.SubjectRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SubjectService {

    private final SubjectRepository repository;

    public SubjectService(SubjectRepository repository) {
        this.repository = repository;
    }

    public Subject add(Subject data) {
        return repository.save(data);
    }

    public List<Subject> getAll() {
        return repository.findAll();
    }

    public Subject getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Subject update(Long id, Subject data) {

        Subject existingSubject = repository.findById(id).orElse(null);

        if (existingSubject == null) {
            return null;
        }

        existingSubject.setName(data.getName());
        existingSubject.setCode(data.getCode());
        existingSubject.setDepartment(data.getDepartment());
        existingSubject.setSemester(data.getSemester());

        return repository.save(existingSubject);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<Subject> search(String keyword) {
        return repository.findByNameContainingIgnoreCaseOrCodeContainingIgnoreCase(
                keyword,
                keyword
        );
    }
}