package com.example.oktasample.product;

import java.net.URI;
import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @GetMapping
    public List<Product> list() {
        return productRepository.findAll();
    }

    @GetMapping("/{id}")
    public Product get(@PathVariable Long id) {
        return productRepository.findById(id).orElseThrow(ProductNotFoundException::new);
    }

    @PostMapping
    public ResponseEntity<Product> create(@Valid @RequestBody ProductRequest request) {
        Product saved = productRepository.save(toProduct(request));
        URI location = ServletUriComponentsBuilder
            .fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(saved.getId())
            .toUri();
        return ResponseEntity.created(location).body(saved);
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        Product product = productRepository.findById(id).orElseThrow(ProductNotFoundException::new);
        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        return productRepository.save(product);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!productRepository.existsById(id)) {
            throw new ProductNotFoundException();
        }
        productRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserProfile me(@AuthenticationPrincipal Jwt jwt) {
        return new UserProfile(
            jwt.getSubject(),
            jwt.getClaimAsString("email"),
            jwt.getClaimAsString("name")
        );
    }

    private Product toProduct(ProductRequest request) {
        return new Product(request.name(), request.description(), request.price());
    }

    public record UserProfile(String subject, String email, String name) {
    }
}
