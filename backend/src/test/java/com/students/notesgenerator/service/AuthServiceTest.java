package com.students.notesgenerator.service;

import com.students.notesgenerator.dto.request.LoginRequest;
import com.students.notesgenerator.dto.request.SignUpRequest;
import com.students.notesgenerator.dto.response.AuthResponse;
import com.students.notesgenerator.entity.Role;
import com.students.notesgenerator.entity.RoleType;
import com.students.notesgenerator.entity.User;
import com.students.notesgenerator.exception.BadRequestException;
import com.students.notesgenerator.repository.RoleRepository;
import com.students.notesgenerator.repository.UserRepository;
import com.students.notesgenerator.security.JwtTokenProvider;
import com.students.notesgenerator.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuthServiceTest {

    @InjectMocks
    private AuthService authService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenProvider tokenProvider;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void registerUser_Success() {
        SignUpRequest request = new SignUpRequest();
        request.setName("John Doe");
        request.setEmail("john@example.com");
        request.setPassword("password123");

        Role role = new Role();
        role.setId(1L);
        role.setName(RoleType.ROLE_STUDENT);

        User user = new User("John Doe", "john@example.com", "encodedPassword");
        user.setId(1L);
        user.setRole(role);

        Authentication auth = mock(Authentication.class);
        UserPrincipal principal = new UserPrincipal(1L, "John Doe", "john@example.com", "encodedPassword", 
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_STUDENT")));

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("encodedPassword");
        when(roleRepository.findByName(RoleType.ROLE_STUDENT)).thenReturn(Optional.of(role));
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(auth.getPrincipal()).thenReturn(principal);
        when(tokenProvider.generateToken(any(Authentication.class))).thenReturn("mockJwtToken");

        AuthResponse response = authService.registerUser(request);

        assertNotNull(response);
        assertEquals("mockJwtToken", response.getAccessToken());
        assertEquals("john@example.com", response.getEmail());
        assertEquals("ROLE_STUDENT", response.getRole());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void registerUser_EmailExists_ThrowsException() {
        SignUpRequest request = new SignUpRequest();
        request.setEmail("john@example.com");

        when(userRepository.existsByEmail("john@example.com")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.registerUser(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void authenticateUser_Success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("john@example.com");
        request.setPassword("password123");

        Authentication auth = mock(Authentication.class);
        UserPrincipal principal = new UserPrincipal(1L, "John Doe", "john@example.com", "password", 
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_STUDENT")));

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(auth.getPrincipal()).thenReturn(principal);
        when(tokenProvider.generateToken(any(Authentication.class))).thenReturn("mockJwtToken");

        AuthResponse response = authService.authenticateUser(request);

        assertNotNull(response);
        assertEquals("mockJwtToken", response.getAccessToken());
        assertEquals("ROLE_STUDENT", response.getRole());
        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }
}
