package com.example.noteshare.note.service;

import com.example.noteshare.note.entity.Note;
import com.example.noteshare.note.repository.NoteRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NoteService {

    private final NoteRepository repository;

    public NoteService(NoteRepository repository) {
        this.repository = repository;
    }

    public Note add(Note data) {
        return repository.save(data);
    }

    public List<Note> getAll() {
        return repository.findAll();
    }

    public Note getById(Long id) {
        return repository.findById(id).orElse(null);
    }

    public Note update(Long id, Note data) {

        Note existingNote = repository.findById(id).orElse(null);

        if (existingNote == null) {
            return null;
        }

        existingNote.setTitle(data.getTitle());
        existingNote.setDescription(data.getDescription());
        existingNote.setFileUrl(data.getFileUrl());
        existingNote.setStudentId(data.getStudentId());
        existingNote.setSubjectId(data.getSubjectId());

        return repository.save(existingNote);
    }

    public void delete(Long id) {
        repository.deleteById(id);
    }

    public List<Note> search(String keyword) {
        return repository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                keyword,
                keyword
        );
    }
}