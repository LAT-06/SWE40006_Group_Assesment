<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import LoadingSpinner from '@/components/ui/LoadingSpinner.vue'

const props = defineProps<{ productId: string }>()

const authStore = useAuthStore()

interface ReviewRow {
  id: string
  rating: number
  comment: string | null
  created_at: string
  user_id: string
  profile?: { full_name: string | null } | null
}

const reviews = ref<ReviewRow[]>([])
const loading = ref(true)
const fetchError = ref('')

// New review form
const newRating = ref(5)
const newComment = ref('')
const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)

const averageRating = computed(() => {
  if (reviews.value.length === 0) return 0
  return reviews.value.reduce((sum, r) => sum + r.rating, 0) / reviews.value.length
})

const hasUserReviewed = computed(() =>
  authStore.user ? reviews.value.some((r) => r.user_id === authStore.user!.id) : false
)

async function fetchReviews() {
  loading.value = true
  fetchError.value = ''
  try {
    const { data } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id')
      .eq('product_id', props.productId)
      .order('created_at', { ascending: false })

    if (!data) { reviews.value = []; return }

    // Fetch profile names for review authors
    const userIds = [...new Set(data.map((r) => r.user_id).filter(Boolean))] as string[]
    let profileMap: Record<string, string | null> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds)
      if (profiles) {
        for (const p of profiles) profileMap[p.id] = p.full_name
      }
    }

    reviews.value = data.map((r) => ({
      id: r.id,
      rating: r.rating ?? 0,
      comment: r.comment,
      created_at: r.created_at ?? '',
      user_id: r.user_id ?? '',
      profile: r.user_id ? { full_name: profileMap[r.user_id] ?? null } : null,
    }))
  } catch (e: unknown) {
    fetchError.value = e instanceof Error ? e.message : 'Failed to load reviews'
  } finally {
    loading.value = false
  }
}

async function handleSubmit() {
  submitError.value = ''
  submitSuccess.value = false

  if (!authStore.user) {
    submitError.value = 'Please log in to leave a review'
    return
  }

  submitting.value = true
  try {
    const { error } = await supabase.from('reviews').insert({
      product_id: props.productId,
      user_id: authStore.user.id,
      rating: newRating.value,
      comment: newComment.value.trim() || null,
    })
    if (error) throw error
    submitSuccess.value = true
    newComment.value = ''
    newRating.value = 5
    await fetchReviews()
  } catch (e: unknown) {
    submitError.value = (e instanceof Error ? e.message : null) || 'Failed to submit review'
  } finally {
    submitting.value = false
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

onMounted(fetchReviews)
</script>

<template>
  <div class="product-reviews">
    <!-- Summary -->
    <div class="reviews-summary">
      <div class="avg-rating">
        <span class="avg-number">{{ averageRating.toFixed(1) }}</span>
        <div class="avg-stars">
          <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= Math.round(averageRating) }">★</span>
        </div>
        <span class="review-count">{{ reviews.length }} review{{ reviews.length !== 1 ? 's' : '' }}</span>
      </div>
    </div>

    <!-- Write review -->
    <div v-if="authStore.isAuthenticated && !hasUserReviewed" class="write-review">
      <h4>Write a Review</h4>
      <div v-if="submitError" class="error-msg">{{ submitError }}</div>
      <div v-if="submitSuccess" class="success-msg">Review submitted!</div>
      <form v-if="!submitSuccess" @submit.prevent="handleSubmit">
        <div class="rating-input">
          <label>Rating:</label>
          <div class="star-selector">
            <button
              v-for="i in 5"
              :key="i"
              type="button"
              class="star-btn"
              :class="{ active: i <= newRating }"
              @click="newRating = i"
            >★</button>
          </div>
        </div>
        <textarea
          v-model="newComment"
          placeholder="Share your thoughts about this product…"
          rows="3"
          class="comment-input"
        ></textarea>
        <button type="submit" class="submit-review-btn" :disabled="submitting">
          {{ submitting ? 'Submitting…' : 'Submit Review' }}
        </button>
      </form>
    </div>
    <div v-else-if="!authStore.isAuthenticated" class="login-prompt">
      <router-link to="/login">Sign in</router-link> to leave a review.
    </div>

    <!-- Reviews list -->
    <LoadingSpinner v-if="loading" message="Loading reviews..." padding="16px 0" />
    <div v-else-if="fetchError" style="color: #e74c3c; padding: 16px 0">Failed to load reviews. <a href="#" @click.prevent="fetchReviews">Retry</a></div>
    <div v-else-if="reviews.length === 0" style="color: #999; padding: 16px 0">No reviews yet. Be the first to review!</div>
    <div v-else class="reviews-list">
      <div v-for="review in reviews" :key="review.id" class="review-item">
        <div class="review-header">
          <div class="review-stars">
            <span v-for="i in 5" :key="i" class="star" :class="{ filled: i <= review.rating }">★</span>
          </div>
          <span class="review-author">{{ review.profile?.full_name || 'Anonymous' }}</span>
          <span class="review-date">{{ formatDate(review.created_at) }}</span>
        </div>
        <p v-if="review.comment" class="review-comment">{{ review.comment }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reviews-summary {
  margin-bottom: 24px;
}
.avg-rating {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avg-number {
  font-size: 36px;
  font-weight: 900;
  color: var(--headline);
}
.avg-stars {
  display: flex;
  gap: 2px;
}
.star {
  color: #ddd;
  font-size: 18px;
}
.star.filled {
  color: #ffd700;
}
.review-count {
  color: var(--paragraph);
  font-size: 14px;
}

.write-review {
  background: var(--main);
  border: 2px solid var(--stroke);
  padding: 20px;
  margin-bottom: 24px;
}
.write-review h4 {
  margin-bottom: 12px;
  color: var(--headline);
}
.rating-input {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.rating-input label {
  font-weight: 600;
  color: var(--headline);
}
.star-selector {
  display: flex;
  gap: 4px;
}
.star-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #ddd;
  padding: 0;
  transition: color 0.15s;
}
.star-btn.active {
  color: #ffd700;
}
.comment-input {
  width: 100%;
  padding: 10px 14px;
  border: 2px solid var(--stroke);
  font-family: inherit;
  font-size: 14px;
  resize: vertical;
  margin-bottom: 12px;
  box-sizing: border-box;
}
.submit-review-btn {
  background: var(--button);
  color: var(--button-text);
  border: 2px solid var(--stroke);
  padding: 10px 20px;
  font-family: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}
.submit-review-btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: 3px 3px 0 var(--stroke);
}

.login-prompt {
  background: var(--main);
  border: 2px solid var(--stroke);
  padding: 16px 20px;
  margin-bottom: 24px;
  color: var(--paragraph);
}
.login-prompt a {
  color: var(--button);
  font-weight: 700;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.review-item {
  border-bottom: 2px solid var(--stroke);
  padding-bottom: 16px;
}
.review-item:last-child {
  border-bottom: none;
}
.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}
.review-stars {
  display: flex;
  gap: 2px;
}
.review-author {
  font-weight: 700;
  color: var(--headline);
  font-size: 14px;
}
.review-date {
  color: var(--paragraph);
  opacity: 0.6;
  font-size: 13px;
}
.review-comment {
  color: var(--paragraph);
  line-height: 1.6;
}
.error-msg {
  color: #e74c3c;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
}
.success-msg {
  color: #27ae60;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
}
</style>
