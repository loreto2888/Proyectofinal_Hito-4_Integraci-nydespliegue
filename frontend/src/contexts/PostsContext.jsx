import { createContext, useContext, useEffect, useState } from 'react'
import { createPost, fetchPosts } from '../services/postsService'

const PostsContext = createContext()

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const data = await fetchPosts()
        setPosts(data)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const addPost = async (post, token) => {
    const created = await createPost(post, token)
    setPosts((prev) => [created, ...prev])
  }

  const getPostById = (id) => posts.find((p) => String(p.id) === String(id))

  const value = { posts, loading, addPost, getPostById }

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
}

export function usePosts() {
  const ctx = useContext(PostsContext)
  if (!ctx) throw new Error('usePosts debe usarse dentro de PostsProvider')
  return ctx
}
