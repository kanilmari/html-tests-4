import openai
import numpy as np

# Set your OpenAI API key
openai.api_key = "sk-3EonDMY69hQe3oh0e3tvTS1nVwl5Tn0aJGrnzeiNwJT3BlbkFJs7GsFcgjD23JoPBA--_AFpqyrmF7p9iePwk6WgsuwA"

def get_embedding(text):
    response = openai.embeddings.create(
        input=text,
        model="text-embedding-ada-002"
    )
    return np.array(response.data[0].embedding)  # Oikea tapa käyttää vastausta

# Hanki embeddingit
dog_vector = get_embedding("dog")
puppy_vector = get_embedding("puppy")
cat_vector = get_embedding("cat")
kitty_vector = get_embedding("kitty")

# Laske erot
dog_puppy_diff = dog_vector - puppy_vector
cat_kitty_diff = cat_vector - kitty_vector

# Laske kosinietäisyys (tai käytä muuta etäisyysmittaria)
cosine_similarity = np.dot(dog_puppy_diff, cat_kitty_diff) / (np.linalg.norm(dog_puppy_diff) * np.linalg.norm(cat_kitty_diff))

print(f"Cosine similarity between (dog - puppy) and (cat - kitty): {cosine_similarity}")
