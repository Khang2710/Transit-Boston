package com.izikwen.mbtaoptimizer.controller;

import com.izikwen.mbtaoptimizer.dto.response.DataSetResponse;
import com.izikwen.mbtaoptimizer.service.DataSetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/datasets")
public class DataSetController {

    private final DataSetService dataSetService;

    public DataSetController(DataSetService dataSetService) {
        this.dataSetService = dataSetService;
    }

    /** POST /api/datasets/generate?seed=42  — generate a new random dataset */
    @PostMapping("/generate")
    public ResponseEntity<DataSetResponse> generate(
            @RequestParam(required = false) Long seed) {
        return ResponseEntity.ok(dataSetService.generate(seed));
    }

    /** GET /api/datasets  — list all datasets */
    @GetMapping
    public ResponseEntity<List<DataSetResponse>> listAll() {
        return ResponseEntity.ok(dataSetService.listAll());
    }

    /** GET /api/datasets/{id}  — get a dataset with zone data */
    @GetMapping("/{id}")
    public ResponseEntity<DataSetResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(dataSetService.getById(id));
    }

    /** POST /api/datasets/{id}/activate  — select this dataset as active */
    @PostMapping("/{id}/activate")
    public ResponseEntity<DataSetResponse> activate(@PathVariable Long id) {
        return ResponseEntity.ok(dataSetService.activate(id));
    }

    /** DELETE /api/datasets/{id}  — delete a dataset */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        dataSetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
