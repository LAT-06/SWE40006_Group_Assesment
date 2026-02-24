import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { supabase } from "@/lib/supabase";
import type { User, Session, AuthError } from "@supabase/supabase-js";

export const useAuthStore = defineStore("auth", () => {
    const user = ref<User | null>(null);
    const session = ref<Session | null>(null);
    const loading = ref(true);
    const userRole = ref<string | null>(null);

    const isAuthenticated = computed(() => !!user.value);
    const isAdmin = computed(() => userRole.value === "admin");

    async function fetchUserRole(userId: string) {
        const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();
        userRole.value = data?.role ?? null;
    }

    async function initialize() {
        loading.value = true;
        try {
            const {
                data: { session: initialSession },
            } = await supabase.auth.getSession();
            session.value = initialSession;
            user.value = initialSession?.user ?? null;
            if (user.value) await fetchUserRole(user.value.id);

            supabase.auth.onAuthStateChange(async (_event, newSession) => {
                session.value = newSession;
                user.value = newSession?.user ?? null;
                if (user.value) await fetchUserRole(user.value.id);
                else userRole.value = null;
            });
        } catch (error) {
            console.error("Error initializing auth:", error);
        } finally {
            loading.value = false;
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
                    redirectTo: `${window.location.origin}/`,
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
