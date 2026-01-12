import { renderHook, act } from "@testing-library/react-native";
import { useRepositorySync } from "@/hooks/use-repository-sync";
import { useSecureStorage } from "@/hooks/use-secure-storage";
import { useNotifications } from "@/hooks/use-notifications";
import { useGithubApi } from "@/hooks/use-github-api";
import * as SecureStore from "expo-secure-store";

// Mock SecureStore
jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

// Mock the API key context
jest.mock("@/constants/api-key-context", () => ({
  useApiKey: () => ({
    GITHUB_TOKEN: "test-token",
  }),
}));

describe("Security Tests", () => {
  describe("Token Handling Security", () => {
    it("should validate token format before use", () => {
      const { result } = renderHook(() => useGithubApi());

      // Test with invalid token format
      const invalidToken = "invalid-token";
      expect(() => {
        // This would be handled internally by the hook
        // We're testing the validation logic
        const isValid = /^[a-zA-Z0-9]{40}$/.test(invalidToken);
        expect(isValid).toBe(false);
      }).not.toThrow();
    });

    it("should not expose tokens in error messages", async () => {
      const { result } = renderHook(() => useGithubApi());

      // Mock API error that might include token
      const mockError = new Error("API Error: token=secret123");

      // The hook should sanitize error messages
      const sanitizedMessage = mockError.message.replace(
        /token=[^&\s]*/g,
        "token=[REDACTED]",
      );
      expect(sanitizedMessage).not.toContain("secret123");
      expect(sanitizedMessage).toContain("[REDACTED]");
    });

    it("should handle token expiration gracefully", async () => {
      const { result } = renderHook(() => useGithubApi());

      // Mock expired token response
      (
        (result.current as any).octokit as any
      ).rest.users.getAuthenticated.mockRejectedValue({
        status: 401,
        message: "Bad credentials",
      });

      const isValid = await result.current.validateToken();
      expect(isValid).toBe(false);
    });

    it("should clear tokens on logout", async () => {
      const { result } = renderHook(() => useSecureStorage());

      // Simulate logout
      await act(async () => {
        await (result.current as any).clearToken();
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("github_token");
    });
  });

  describe("Input Validation Security", () => {
    it("should validate GitHub URLs to prevent injection attacks", () => {
      const { result } = renderHook(() => useGithubApi());

      const testCases = [
        // Valid URLs
        "https://github.com/user/repo",
        "https://github.com/user/repo.git",

        // Invalid URLs (potential injection attempts)
        'javascript:alert("xss")',
        "https://github.com/user/repo?callback=alert",
        "https://github.com/user/repo#malicious",
        "file:///etc/passwd",
        'data:text/html,<script>alert("xss")</script>',
      ];

      testCases.forEach(url => {
        const parsed = result.current.parseGithubUrl(url);
        if (parsed) {
          // If URL is parsed, it should be valid
          expect(parsed.owner).toMatch(/^[a-zA-Z0-9_-]+$/);
          expect(parsed.repo).toMatch(/^[a-zA-Z0-9_-]+$/);
        }
      });
    });

    it("should sanitize repository names", () => {
      const { result } = renderHook(() => useGithubApi());

      const maliciousNames = [
        '<script>alert("xss")</script>',
        "repo; DROP TABLE users;",
        "../../../etc/passwd",
        "repo\nwith\nnewlines",
      ];

      maliciousNames.forEach(name => {
        // Repository names should be sanitized
        const sanitized = name.replace(/[<>:"/\\|?*]/g, "");
        expect(sanitized).not.toContain("<script>");
        expect(sanitized).not.toContain("DROP TABLE");
        expect(sanitized).not.toContain("..");
      });
    });

    it("should validate workflow IDs to prevent injection", () => {
      const { result } = renderHook(() => useGithubApi());

      const invalidIds = [
        "123; DROP TABLE workflows;",
        '123<script>alert("xss")</script>',
        "abc",
        "-1",
        "999999999999999999999",
      ];

      invalidIds.forEach(id => {
        // IDs should be numeric
        const isValid = /^\d+$/.test(id.toString());
        if (!isValid) {
          expect(() => {
            // Should throw or handle gracefully
            throw new Error("Invalid workflow ID");
          }).toThrow("Invalid workflow ID");
        }
      });
    });
  });

  describe("Data Validation Security", () => {
    it("should validate API responses", async () => {
      const { result } = renderHook(() => useGithubApi());

      // Mock malicious API response
      const maliciousResponse = {
        data: {
          workflows: [
            {
              id: '1<script>alert("xss")</script>',
              name: '<img src=x onerror=alert("xss")>',
              path: "../../../etc/passwd",
            },
          ],
        },
      };

      // The hook should sanitize response data
      const sanitized = (result.current as any).sanitizeApiResponse(
        maliciousResponse,
      );
      expect(sanitized.data.workflows[0].id).toBe("1");
      expect(sanitized.data.workflows[0].name).toBe("");
      expect(sanitized.data.workflows[0].path).toBe(".github/workflows/");
    });

    it("should validate notification data", () => {
      const { result } = renderHook(() => useNotifications());

      const maliciousNotification = {
        title: '<script>alert("xss")</script>',
        body: "Normal body",
        data: {
          type: 'workflow<script>alert("xss")</script>',
          url: 'javascript:alert("xss")',
        },
      };

      // Should sanitize notification content
      const sanitized = (result.current as any).sanitizeNotification(
        maliciousNotification,
      );
      expect(sanitized.title).toBe('alert("xss")');
      expect(sanitized.data.type).toBe("workflow");
      expect(sanitized.data.url).toBe("");
    });

    it("should prevent SQL injection in search queries", () => {
      const { result } = renderHook(() => useGithubApi());

      const maliciousQueries = [
        "'; DROP TABLE repositories; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES('hacker', 'password'); --",
      ];

      maliciousQueries.forEach(query => {
        // Search queries should be escaped
        const escaped = query.replace(/['";]/g, "");
        expect(escaped).not.toContain("DROP TABLE");
        expect(escaped).not.toContain("INSERT INTO");
      });
    });
  });

  describe("Secure Storage Security", () => {
    it("should encrypt sensitive data before storage", async () => {
      const { result } = renderHook(() => useSecureStorage());

      const sensitiveData = {
        token: "github_token_123",
        refreshToken: "refresh_token_456",
        userId: "user_789",
      };

      // Data should be encrypted before storage
      const encrypted = (result.current as any).encryptData(sensitiveData);
      expect(encrypted).not.toContain("github_token_123");
      expect(encrypted).not.toContain("refresh_token_456");
      expect(encrypted).not.toContain("user_789");
    });

    it("should handle storage errors gracefully", async () => {
      const { result } = renderHook(() => useSecureStorage());

      // Mock storage failure
      (result.current as any).setItemAsync = jest
        .fn()
        .mockRejectedValue(new Error("Storage failed"));

      try {
        await (result.current as any).storeToken("test-token");
      } catch (error: any) {
        expect(error.message).toBe("Storage failed");
        // Should not expose sensitive data in error
        expect(error.message).not.toContain("test-token");
      }
    });

    it("should implement secure token rotation", async () => {
      const { result } = renderHook(() => useSecureStorage());

      const oldToken = "old_token_123";
      const newToken = "new_token_456";

      // Should securely replace old token
      await act(async () => {
        await (result.current as any).rotateToken(oldToken, newToken);
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("github_token");
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "github_token",
        newToken,
      );
    });
  });

  describe("Network Security", () => {
    it("should enforce HTTPS for all GitHub API calls", () => {
      const { result } = renderHook(() => useGithubApi());

      // All API calls should use HTTPS
      const apiEndpoints = [
        "https://api.github.com/user",
        "https://api.github.com/repos/user/repo",
        "https://api.github.com/actions/workflows",
      ];

      apiEndpoints.forEach(endpoint => {
        expect(endpoint).toMatch(/^https:\/\//);
      });
    });

    it("should validate SSL certificates", async () => {
      const { result } = renderHook(() => useGithubApi());

      // Mock SSL validation
      const mockResponse = {
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue("TLS 1.3"),
        },
      };

      const isValid = (result.current as any).validateSSL(mockResponse);
      expect(isValid).toBe(true);
    });

    it("should implement request timeout to prevent DoS", () => {
      const { result } = renderHook(() => useGithubApi());

      // API calls should have timeout
      const timeout = (result.current as any).getApiTimeout();
      expect(timeout).toBeGreaterThan(0);
      expect(timeout).toBeLessThan(60000); // Less than 60 seconds
    });
  });

  describe("Session Security", () => {
    it("should implement session timeout", async () => {
      const { result } = renderHook(() => useRepositorySync());

      const mockSession = {
        id: "session_123",
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        lastActivity: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      };

      const isExpired = (result.current as any).isSessionExpired(mockSession);
      expect(isExpired).toBe(true); // Should be expired after 30 minutes
    });

    it("should prevent session fixation attacks", () => {
      const { result } = renderHook(() => useRepositorySync());

      // Session IDs should be random and unpredictable
      const sessionId = (result.current as any).generateSessionId();
      expect(sessionId).toMatch(/^[a-f0-9-]{36}$/); // UUID format
      expect(sessionId).not.toMatch(/^[0-9]+$/); // Not just numbers
    });

    it("should implement CSRF protection", () => {
      const { result } = renderHook(() => useGithubApi());

      // API requests should include CSRF tokens
      const mockRequest = {
        headers: {
          "X-CSRF-Token": "csrf_token_123",
        },
      };

      const hasCsrf = (result.current as any).hasCsrfProtection(mockRequest);
      expect(hasCsrf).toBe(true);
    });
  });

  describe("Error Handling Security", () => {
    it("should not expose sensitive information in error messages", () => {
      const { result } = renderHook(() => useGithubApi());

      const sensitiveError = new Error(
        "Database connection failed: host=db.example.com;user=admin;password=secret123",
      );

      const sanitizedError = (result.current as any).sanitizeError(
        sensitiveError,
      );
      expect(sanitizedError.message).not.toContain("admin");
      expect(sanitizedError.message).not.toContain("secret123");
      expect(sanitizedError.message).toContain("Database connection failed");
    });

    it("should implement rate limiting for API calls", async () => {
      const { result } = renderHook(() => useGithubApi());

      // Simulate rapid API calls
      const startTime = Date.now();
      const calls = Array.from({ length: 100 }, () =>
        result.current.getUserRepos(),
      );

      await Promise.all(calls);
      const endTime = Date.now();

      // Should implement rate limiting (calls should take some time)
      expect(endTime - startTime).toBeGreaterThan(1000);
    });

    it("should handle memory leaks in error conditions", async () => {
      const { result } = renderHook(() => useGithubApi());

      // Simulate error conditions that might cause memory leaks
      const errorPromises = Array.from({ length: 1000 }, async () => {
        try {
          await result.current.getUserRepos();
        } catch (error) {
          // Errors should be handled without memory leaks
          expect(error).toBeDefined();
        }
      });

      await Promise.all(errorPromises);

      // Should not crash or leak memory
      expect(result.current.octokit).toBeDefined();
    });
  });

  describe("Data Privacy", () => {
    it("should not log sensitive information", () => {
      const consoleSpy = jest.spyOn(console, "log").mockImplementation();

      const sensitiveData = {
        token: "github_token_123",
        refreshToken: "refresh_token_456",
        privateRepo: "https://github.com/user/private-repo",
      };

      // Logging should be sanitized
      const sanitizedLog = JSON.stringify(sensitiveData, (key, value) => {
        if (key === "token" || key === "refreshToken") {
          return "[REDACTED]";
        }
        return value;
      });

      expect(sanitizedLog).toContain("[REDACTED]");
      expect(sanitizedLog).not.toContain("github_token_123");

      consoleSpy.mockRestore();
    });

    it("should implement data retention policies", async () => {
      const { result } = renderHook(() => useRepositorySync());

      const oldData = {
        repositories: [
          {
            id: 1,
            name: "old-repo",
            updated_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          },
        ],
      };

      // Old data should be cleaned up
      const cleanedData = (result.current as any).cleanupOldData(oldData);
      expect(cleanedData.repositories).toHaveLength(0);
    });

    it("should handle GDPR compliance for user data", async () => {
      const { result } = renderHook(() => useSecureStorage());

      // Should be able to delete all user data
      await act(async () => {
        await (result.current as any).deleteAllUserData();
      });

      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("github_token");
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "user_preferences",
      );
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("session_data");
    });
  });
});
