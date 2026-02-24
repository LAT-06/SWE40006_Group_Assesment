import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import type { User, Session, AuthError } from "@supabase/supabase-js";

export const useAuthStore = defineStore("auth", () => {
    const user = ref<User | null>(null);
    const session = ref<Session | null>(null);
    const loading = ref(true);
    const initialized = ref(false);
    // roleReady becomes true only after fetchUserRole() resolves.
    // The router guard waits on this (not just `initialized`) before
    // evaluating isAdmin, eliminating the race window.
    const roleReady = ref(false);
    const userRole = ref<string | null>(null);
    let _listenerRegistered = false;

    const isAuthenticated = computed(() => !!user.value);
    const isAdmin = computed(() => userRole.value === "admin");

    async function fetchUserRole(userId: string) {
        roleReady.value = false;
        const { data, error } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();
        if (error) console.error("fetchUserRole error:", error.message);
        userRole.value = data?.role ?? null;
        roleReady.value = true;
    }

    async function initialize() {
        if (initialized.value) return;   // idempotent
        loading.value = true;
        try {
            const {
                data: { session: initialSession },
            } = await supabase.auth.getSession();
            session.value = initialSession;
            user.value = initialSession?.user ?? null;
            if (user.value) await fetchUserRole(user.value.id);

            if (!_listenerRegistered) {
                _listenerRegistered = true;
                supabase.auth.onAuthStateChange(async (event, newSession) => {
                    // INITIAL_SESSION is already handled by getSession() above.
                    // Skipping it prevents a race where userRole is reset to null
                    // and re-fetched, briefly making isAdmin false right as the
                    // router guard evaluates it.
                    if (event === "INITIAL_SESSION") return;
                    session.value = newSession;
                    user.value = newSession?.user ?? null;
                    if (user.value) await fetchUserRole(user.value.id);
                    else {
                        userRole.value = null;
                        roleReady.value = false;
                    }
                });
            }
        } catch (error) {
            console.error("Error initializing auth:", error);
        } finally {
            loading.value = false;
            initialized.value = true;  // always mark done even on error
        }
    }

    async function signUp(email: string, password: string, fullName: string) {
        loading.value = true;
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error("Sign up error:", error);
            return { data: null, error: error as AuthError };
        } finally {
            loading.value = false;
        }
    }

    async function signIn(
        email: string,
        password: string,
        rememberMe: boolean = false,
    ) {
        loading.value = true;
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;
            // Update user/session and fetch role immediately so isAdmin is correct
            user.value = data.user;
            session.value = data.session;
            if (data.user) await fetchUserRole(data.user.id);
            return { data, error: null };
        } catch (error) {
            console.error("Sign in error:", error);
            return { data: null, error: error as AuthError };
        } finally {
            loading.value = false;
        }
    }

    async function signInWithGoogle() {
        loading.value = true;
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error("Google sign in error:", error);
            return { data: null, error: error as AuthError };
        } finally {
            loading.value = false;
        }
    }

    async function signOut() {
        loading.value = true;
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            user.value = null;
            session.value = null;
            userRole.value = null;
            return { error: null };
        } catch (error) {
            console.error("Sign out error:", error);
            return { error: error as AuthError };
        } finally {
            loading.value = false;
        }
    }

    async function resetPassword(email: string) {
        loading.value = true;
        try {
            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error("Password reset error:", error);
            return { data: null, error: error as AuthError };
        } finally {
            loading.value = false;
        }
    }

    return {
        user,
        session,
        loading,
        initialized,
        roleReady,
        userRole,
        isAuthenticated,
        isAdmin,
        initialize,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
    };
});
