import { createContext, useContext, useEffect, useState } from 'react'
import { createPost, fetchPosts, updatePost as updatePostRequest } from '../services/postsService'

const PostsContext = createContext()

export function PostsProvider({ children }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)

  const refreshPosts = async () => {
    setLoading(true)
    try {
      const data = await fetchPosts()
      setPosts(data)
      return data
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshPosts()
  }, [])

  const addPost = async (post, token, user) => {
    const created = await createPost(post, token)
    setPosts((prev) => [
      {
        ...created,
        user: created.user?.name ? created.user : user ? { id: user.id, name: user.name } : created.user,
      },
      ...prev,
    ])
  }

  const updatePost = async (id, post, token) => {
    const updated = await updatePostRequest(id, post, token)

    setPosts((prev) =>
      prev.map((currentPost) =>
        String(currentPost.id) === String(id)
          ? {
              ...currentPost,
              ...updated,
              user: currentPost.user,
              mainImage: currentPost.mainImage,
            }
          : currentPost,
      ),
    )

    return updated
  }

  const getPostById = (id) => posts.find((p) => String(p.id) === String(id))

  const value = { posts, loading, addPost, updatePost, getPostById, refreshPosts }

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>
}

export function usePosts() {
  const ctx = useContext(PostsContext)
  if (!ctx) throw new Error('usePosts debe usarse dentro de PostsProvider')
  return ctx
}
