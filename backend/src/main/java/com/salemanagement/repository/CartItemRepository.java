package com.salemanagement.repository;

import com.salemanagement.entity.Cart;
import com.salemanagement.entity.CartItem;
import com.salemanagement.entity.ProductVariant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    List<CartItem> findByCartOrderByIdAsc(Cart cart);

    Optional<CartItem> findByCartAndVariant(Cart cart, ProductVariant variant);

    void deleteByCart(Cart cart);
}
