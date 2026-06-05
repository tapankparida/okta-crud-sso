package com.example.oktasample.product;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:products;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.security.oauth2.resourceserver.jwt.issuer-uri=https://issuer.example.com",
    "spring.security.oauth2.resourceserver.jwt.jwk-set-uri=https://issuer.example.com/jwks",
    "app.cors.allowed-origins=http://localhost:5173"
})
@AutoConfigureMockMvc
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ProductRepository productRepository;

    @BeforeEach
    void setUp() {
        productRepository.deleteAll();
    }

    @Test
    void rejectsUnauthenticatedRequests() throws Exception {
        mockMvc.perform(get("/api/products"))
            .andExpect(status().isUnauthorized())
            .andExpect(header().string("WWW-Authenticate", "Bearer"));
    }

    @Test
    void runsProductCrudFlowWithJwt() throws Exception {
        mockMvc.perform(get("/api/products").with(jwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));

        String createResponse = mockMvc.perform(post("/api/products")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Starter License",
                      "description": "Basic monthly license",
                      "price": 29.99
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Starter License"))
            .andExpect(jsonPath("$.price").value(29.99))
            .andReturn()
            .getResponse()
            .getContentAsString();

        Long id = JsonTestSupport.extractId(createResponse);

        mockMvc.perform(get("/api/products/{id}", id).with(jwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Starter License"));

        mockMvc.perform(put("/api/products/{id}", id)
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Professional License",
                      "description": "Expanded monthly license",
                      "price": 59.99
                    }
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Professional License"))
            .andExpect(jsonPath("$.price").value(59.99));

        mockMvc.perform(delete("/api/products/{id}", id).with(jwt()))
            .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/products").with(jwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void returnsProfileFromJwtClaims() throws Exception {
        mockMvc.perform(get("/api/products/me")
                .with(jwt().jwt(jwt -> jwt
                    .subject("00u123")
                    .claim("email", "user@example.com")
                    .claim("name", "Test User"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.subject").value("00u123"))
            .andExpect(jsonPath("$.email").value("user@example.com"))
            .andExpect(jsonPath("$.name").value("Test User"));
    }

    private static final class JsonTestSupport {

        private JsonTestSupport() {
        }

        private static Long extractId(String json) {
            String idPrefix = "\"id\":";
            int idStart = json.indexOf(idPrefix) + idPrefix.length();
            int idEnd = json.indexOf(",", idStart);
            return Long.valueOf(json.substring(idStart, idEnd));
        }
    }
}
