#!/bin/bash
test_url() {
  code=$(curl -s -o /dev/null -w "%{http_code}" -m 8 "$1")
  echo "$code  $1"
}
test_url "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Futsal_court.jpg/320px-Futsal_court.jpg"
test_url "https://upload.wikimedia.org/wikipedia/commons/9/92/Futsal_court.jpg"
test_url "https://www.wikimedia.org"
test_url "https://images.pexels.com/photos/2476090/pexels-photo-2476090.jpeg?auto=compress&cs=tinysrgb&w=800"
test_url "https://images.pexels.com"
test_url "https://cdn.pixabay.com/photo/2017/08/04/14/26/futsal-2586667_1280.jpg"
test_url "https://raw.githubusercontent.com"
test_url "https://github.com"
test_url "https://picsum.photos/800"
test_url "https://picsum.photos/id/1044/800"
