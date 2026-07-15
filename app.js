const SUPABASE_URL = "https://dgivyvqvmmscicqltkze.supabase.co";
const SUPABASE_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

const client = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function loadPosts() {

    const { data, error } = await client
        .from("posts")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

    if (error) {
        console.log(error);
        return;
    }

    const box = document.getElementById("posts");
    box.innerHTML = "";

    data.forEach(post => {

        box.innerHTML += `
        <div class="post">

            <h3>${escapeHTML(post.title)}</h3>

            <p>${escapeHTML(post.content)}</p>

            ${
                post.image_url
                    ? `<img src="${post.image_url}">`
                    : ""
            }

            <p>Deleted after ${daysLeft(post.expires_at)} days</p>

        </div>
        `;
    });
}

async function createPost() {

    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const file = document.getElementById("image").files[0];
    const days = Number(document.getElementById("expiry").value);

    if (days < 1 || days > 30) {
        alert("Expiry must be between 1 and 30 days");
        return;
    }

    let imageURL = null;

    if (file) {

        const filename = Date.now() + "-" + file.name;

        const { error: uploadError } = await client.storage
            .from("images")
            .upload(filename, file);

        if (uploadError) {
            console.log(uploadError);
            return;
        }

        const result = client.storage
            .from("images")
            .getPublicUrl(filename);

        imageURL = result.data.publicUrl;
    }

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + days);

    const { error } = await client
        .from("posts")
        .insert({
            title: title,
            content: content,
            image_url: imageURL,
            expires_at: expiry.toISOString()
        });

    if (error) {
        console.log(error);
        return;
    }

    document.getElementById("title").value = "";
    document.getElementById("content").value = "";
    document.getElementById("image").value = "";

    loadPosts();
}

function daysLeft(date) {

    const difference = new Date(date) - new Date();

    return Math.ceil(
        difference / (1000 * 60 * 60 * 24)
    );
}

function escapeHTML(text) {

    if (!text) {
        return "";
    }

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

loadPosts();
