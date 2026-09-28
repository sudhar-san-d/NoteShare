package com.example.noteshare.student.service;

import com.example.noteshare.student.entity.Student;
import com.example.noteshare.student.repository.StudentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class StudentService {

    private final StudentRepository repository;

    public StudentService(StudentRepository repository) {
        this.repository = repository;
    }

    public Student add(Student data) {
        return repository.save(data);
    }

    public List<Student> getAll() {
        return repository.findAll();
    }

    public Student getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Student update(Long id, Student data) {

        Student existingStudent = repository.findById(id).orElse(null);

        if (existingStudent == null) {
            return null;
        }

        existingStudent.setName(data.getName());
        existingStudent.setEmail(data.getEmail());
        existingStudent.setIsAdmin(data.getIsAdmin());

        return repository.save(existingStudent);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<Student> search(String keyword) {
        return repository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                keyword,
                keyword
        );
    }
}