import { useEffect } from 'react'

export function useTitle(title, description) {
  useEffect(() => {
    document.title = title ? `${title} | Joakina Sushi` : 'Joakina Sushi — Sushi Art · Japanese Experience'
    if (description) document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
}
